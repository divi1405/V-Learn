# AWS Deployment Guide — VeLearn Platform

## Architecture

```
Internet
  │
  ├─► AWS Amplify (web/)          — Next.js 14, auto-deploys on git push
  │
  ├─► AWS Elastic Beanstalk (backend/)  — FastAPI, Docker container
  │       │
  │       └─► Amazon RDS PostgreSQL   — managed database
  │
  └─► EAS Build (mobile/)         — Expo managed workflow, TestFlight / Play Internal
```

---

## 1. Database — Amazon RDS

### Create the instance
```bash
aws rds create-db-instance \
  --db-instance-identifier velearn-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.2 \
  --master-username lms_user \
  --master-user-password <STRONG_PASSWORD> \
  --db-name lms_db \
  --allocated-storage 20 \
  --no-publicly-accessible \
  --vpc-security-group-ids <sg-id>
```

### Migrate from local
```bash
# On your local machine:
pg_dump -U lms_user -h localhost lms_db > lms_db.dump

# Restore to RDS (replace <rds-endpoint>):
psql -U lms_user -h <rds-endpoint> lms_db < lms_db.dump
```

### Connection string for Elastic Beanstalk
```
DATABASE_URL=postgresql://lms_user:<password>@<rds-endpoint>:5432/lms_db
```

---

## 2. Backend — Elastic Beanstalk

### Prerequisites
```bash
pip install awsebcli
eb init velearn-backend --platform docker --region us-east-1
```

### Create environment
```bash
cd backend
eb create velearn-prod \
  --envvars DATABASE_URL="<rds-connection-string>",JWT_SECRET="<secret>",CORS_ORIGINS="https://<amplify-domain>"
```

### Deploy updates
```bash
eb deploy velearn-prod
```

### Required Procfile (already in Dockerfile CMD, but for EB):
The `backend/Dockerfile` should expose port 8000. EB routes traffic from port 80 → 8000.
Make sure the EB security group allows inbound from Amplify and from RDS.

---

## 3. Web Frontend — AWS Amplify

### Connect repo
1. Go to AWS Amplify Console → "New app" → "Host web app"
2. Connect your GitHub repo
3. Set build settings:
   - **App root**: `web`
   - **Build command**: `npm run build`
   - **Output directory**: `.next`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://<eb-endpoint>.elasticbeanstalk.com`

### amplify.yml (place in repo root or web/ folder)
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd web && npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: web/.next
    files:
      - '**/*'
  cache:
    paths:
      - web/node_modules/**/*
```

---

## 4. Mobile — EAS Build

### One-time setup
```bash
npm install -g eas-cli
cd mobile
eas login
eas build:configure
```

### Build for production
```bash
# iOS (TestFlight)
eas build --platform ios --profile production

# Android (Google Play Internal)
eas build --platform android --profile production
```

### eas.json (place in mobile/)
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "staging": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://<eb-endpoint>.elasticbeanstalk.com"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://<eb-endpoint>.elasticbeanstalk.com"
      }
    }
  }
}
```

---

## 5. Environment Variables Summary

| Service | Variable | Where to set |
|---|---|---|
| Backend | `DATABASE_URL` | EB environment variables |
| Backend | `JWT_SECRET` | EB environment variables |
| Backend | `CORS_ORIGINS` | EB environment variables |
| Web | `NEXT_PUBLIC_API_URL` | Amplify environment variables |
| Mobile | `EXPO_PUBLIC_API_URL` | eas.json or EAS secrets |

---

## 6. Security Checklist

- [ ] Change `JWT_SECRET` to a 32+ character random string
- [ ] RDS instance is NOT publicly accessible (only EB security group can reach it)
- [ ] CORS_ORIGINS set to Amplify domain only (no wildcards)
- [ ] Enable RDS automated backups (retention ≥ 7 days)
- [ ] EB uses HTTPS (configure SSL cert via ACM)
