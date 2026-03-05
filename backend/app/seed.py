from app.database import SessionLocal
from app.models import (
    User, Course, Module, Lesson, Quiz, Question, LearningPath, PathCourse,
    Enrollment, LessonProgress, CourseStatus, UserRole, LessonType,
    EnrollmentStatus, LessonStatus, Skill, CourseSkill, Badge, BadgeLevel,
    QuizAttempt, PathStep, StepCheckpoint, UserCheckpointProgress
)
from app.auth import hash_password
from datetime import datetime, timedelta


def seed():
    import traceback
    try:
        _do_seed()
    except Exception as e:
        print(f"❌ Seed error: {e}")
        traceback.print_exc()


def _do_seed():
    db = SessionLocal()

    # if db.query(User).first():
    #     db.close()
    #     return

    print("🌱 Seeding VeLearn database...")

    # --- Users ---
    admin = User(employee_number="SEED-1", name="Alex Admin", email="admin2@company.com", password_hash=hash_password("admin123"),
                 role=UserRole.ADMIN, department="IT", designation="Platform Admin")
    hr = User(employee_number="SEED-2", name="Hannah HR", email="hr@company.com", password_hash=hash_password("hr123"),
              role=UserRole.HR_ADMIN, department="Human Resources", designation="HR Manager")
    learner1 = User(employee_number="SEED-3", name="Sarah Kim", email="sarah@company.com", password_hash=hash_password("learner123"),
                    role=UserRole.LEARNER, department="Engineering", designation="Software Engineer L3")
    learner2 = User(employee_number="SEED-4", name="Tom Rodriguez", email="tom@company.com", password_hash=hash_password("learner123"),
                    role=UserRole.LEARNER, department="Engineering", designation="Software Engineer L2")
    learner3 = User(employee_number="SEED-5", name="Priya Mehta", email="priya@company.com", password_hash=hash_password("learner123"),
                    role=UserRole.LEARNER, department="Engineering", designation="Software Engineer L3")
    learner4 = User(employee_number="SEED-6", name="James Chen", email="james@company.com", password_hash=hash_password("learner123"),
                    role=UserRole.LEARNER, department="Product", designation="Product Manager")
    learner5 = User(employee_number="SEED-7", name="Emily Watson", email="emily@company.com", password_hash=hash_password("learner123"),
                    role=UserRole.LEARNER, department="Design", designation="UX Designer")
    learner6 = User(employee_number="SEED-8", name="Ravi Kumar", email="ravi@company.com", password_hash=hash_password("learner123"),
                    role=UserRole.LEARNER, department="Data Science", designation="Data Scientist")
    learner7 = User(employee_number="SEED-9", name="Lisa Park", email="lisa@company.com", password_hash=hash_password("learner123"),
                    role=UserRole.LEARNER, department="Engineering", designation="ML Engineer")
    learner8 = User(employee_number="SEED-10", name="Omar Hassan", email="omar@company.com", password_hash=hash_password("learner123"),
                    role=UserRole.LEARNER, department="Engineering", designation="AI Research Intern")

    # --- Additional learners for rich leaderboard ---
    learner9 = User(employee_number="SEED-11", name="Aisha Patel", email="aisha@company.com", password_hash=hash_password("learner123"),
                    role=UserRole.LEARNER, department="Sales", designation="Sales Executive")
    learner10 = User(employee_number="SEED-12", name="Daniel Wright", email="daniel@company.com", password_hash=hash_password("learner123"),
                     role=UserRole.LEARNER, department="Marketing", designation="Marketing Analyst")
    learner11 = User(employee_number="SEED-13", name="Sofia Garcia", email="sofia@company.com", password_hash=hash_password("learner123"),
                     role=UserRole.LEARNER, department="Finance", designation="Financial Analyst")
    learner12 = User(employee_number="SEED-14", name="Kevin Zhang", email="kevin@company.com", password_hash=hash_password("learner123"),
                     role=UserRole.LEARNER, department="Operations", designation="Operations Manager")
    learner13 = User(employee_number="SEED-15", name="Nina Thompson", email="nina@company.com", password_hash=hash_password("learner123"),
                     role=UserRole.LEARNER, department="Customer Support", designation="Support Lead")
    learner14 = User(employee_number="SEED-16", name="Marcus Brown", email="marcus@company.com", password_hash=hash_password("learner123"),
                     role=UserRole.LEARNER, department="Engineering", designation="DevOps Engineer")
    learner15 = User(employee_number="SEED-17", name="Yuki Tanaka", email="yuki@company.com", password_hash=hash_password("learner123"),
                     role=UserRole.LEARNER, department="Design", designation="Product Designer")
    learner16 = User(employee_number="SEED-18", name="Carlos Rivera", email="carlos@company.com", password_hash=hash_password("learner123"),
                     role=UserRole.LEARNER, department="Engineering", designation="Backend Engineer")
    learner17 = User(employee_number="SEED-19", name="Rachel Adams", email="rachel@company.com", password_hash=hash_password("learner123"),
                     role=UserRole.LEARNER, department="Legal", designation="Compliance Analyst")
    learner18 = User(employee_number="SEED-20", name="Hassan Ali", email="hassan@company.com", password_hash=hash_password("learner123"),
                     role=UserRole.LEARNER, department="Data Science", designation="ML Research Engineer")
    learner19 = User(employee_number="SEED-21", name="Megan Taylor", email="megan@company.com", password_hash=hash_password("learner123"),
                     role=UserRole.LEARNER, department="Product", designation="Product Lead")
    learner20 = User(employee_number="SEED-22", name="Andre Jackson", email="andre@company.com", password_hash=hash_password("learner123"),
                     role=UserRole.LEARNER, department="Sales", designation="Account Manager")

    db.add_all([admin, hr, learner1, learner2, learner3, learner4, learner5, learner6, learner7, learner8,
                learner9, learner10, learner11, learner12, learner13, learner14, learner15, learner16,
                learner17, learner18, learner19, learner20])
    db.commit()

    # --- AI Courses (YouTube-based) ---
    courses_data = [
        {
            "title": "AI for Everyone",
            "description": "Andrew Ng's beginner-friendly introduction to AI. Learn what AI is, how to build AI projects, and understand its impact on society and business. No programming required.",
            "category": "AI Fundamentals", "difficulty": "beginner", "duration_mins": 360,
            "modules": [
                {"title": "What is AI?", "lessons": [
                    {"title": "Introduction to AI", "type": "video", "url": "https://www.youtube.com/watch?v=4eGap5q4GYg", "content": "<h2>AI for Everyone — Introduction</h2><p>Andrew Ng introduces AI concepts in plain language. This course covers what AI can and cannot do, how to spot AI opportunities, and how to work with AI teams.</p><h3>Key Topics</h3><ul><li>What is AI and Machine Learning?</li><li>What AI can realistically do today</li><li>How to build AI projects in your company</li><li>AI and society — ethical considerations</li></ul>", "duration": 45},
                    {"title": "Machine Learning Basics", "type": "video", "url": "https://www.youtube.com/watch?v=ukzFI9rgwfU", "content": "<h2>Machine Learning Basics</h2><p>Understand supervised learning, data labeling, and how ML models learn from examples. Andrew Ng breaks down complex concepts into intuitive explanations.</p>", "duration": 40},
                    {"title": "Quiz: AI Fundamentals", "type": "quiz", "duration": 10},
                ]},
                {"title": "Building AI Projects", "lessons": [
                    {"title": "Workflow of ML Projects", "type": "video", "url": "https://www.youtube.com/watch?v=UPMnGJ7tVRo", "content": "<h2>ML Project Workflow</h2><p>Learn the end-to-end workflow: collecting data, training models, deploying, and iterating. Understand what makes AI projects succeed or fail.</p>", "duration": 35},
                    {"title": "AI Strategy for Companies", "type": "article", "content": "<h2>AI Strategy</h2><p>How companies can adopt AI strategically.</p><h3>Steps to Build an AI-First Organization</h3><ol><li><strong>Execute pilot projects</strong> — Start small, prove value</li><li><strong>Build an in-house AI team</strong> — Hire or train talent</li><li><strong>Provide broad AI training</strong> — Everyone should understand AI basics</li><li><strong>Develop an AI strategy</strong> — Align AI with business goals</li><li><strong>Develop internal and external communications</strong></li></ol>", "duration": 30},
                    {"title": "Quiz: AI Projects", "type": "quiz", "duration": 10},
                ]},
            ],
        },
        {
            "title": "CS50's AI with Python",
            "description": "Harvard's comprehensive introduction to AI with Python. Covers search algorithms, knowledge representation, machine learning, neural networks, and natural language processing.",
            "category": "AI Programming", "difficulty": "intermediate", "duration_mins": 720,
            "modules": [
                {"title": "Search & Knowledge", "lessons": [
                    {"title": "Search Algorithms", "type": "video", "url": "https://www.youtube.com/watch?v=WbzNRTTrX0g", "content": "<h2>Search Algorithms in AI</h2><p>Harvard CS50 AI covers depth-first search, breadth-first search, A* search, and minimax for game-playing AI. Learn how AI explores solution spaces efficiently.</p><h3>Topics Covered</h3><ul><li>Agent, state, actions, transition model</li><li>DFS vs BFS — trade-offs</li><li>Greedy Best-First Search</li><li>A* Search and heuristics</li><li>Adversarial search — Minimax algorithm</li></ul>", "duration": 60},
                    {"title": "Knowledge Representation", "type": "video", "url": "https://www.youtube.com/watch?v=HWQLez87vqM", "content": "<h2>Knowledge & Logic</h2><p>How AI systems represent and reason about knowledge using propositional logic, first-order logic, and inference algorithms.</p>", "duration": 55},
                    {"title": "Quiz: Search & Knowledge", "type": "quiz", "duration": 10},
                ]},
                {"title": "Machine Learning & Neural Networks", "lessons": [
                    {"title": "Machine Learning Concepts", "type": "video", "url": "https://www.youtube.com/watch?v=cmhMKv3YVZE", "content": "<h2>Machine Learning</h2><p>Classification, regression, reinforcement learning, clustering, and how models generalize from training data.</p>", "duration": 55},
                    {"title": "Neural Networks", "type": "video", "url": "https://www.youtube.com/watch?v=J1QD9hLDEDY", "content": "<h2>Neural Networks</h2><p>Deep dive into artificial neural networks — activation functions, backpropagation, gradient descent, convolutional neural networks for computer vision, and recurrent neural networks for sequences.</p>", "duration": 60},
                    {"title": "Quiz: ML & Neural Networks", "type": "quiz", "duration": 10},
                ]},
                {"title": "NLP & Language Models", "lessons": [
                    {"title": "Natural Language Processing", "type": "video", "url": "https://www.youtube.com/watch?v=0Sz1y309kag", "content": "<h2>Natural Language Processing</h2><p>Text processing, sentiment analysis, bag-of-words, TF-IDF, word embeddings, transformers, and attention mechanisms.</p>", "duration": 55},
                    {"title": "Final Assessment", "type": "quiz", "duration": 15},
                ]},
            ],
        },
        {
            "title": "Machine Learning Specialization",
            "description": "Andrew Ng's Stanford-backed ML specialization covering supervised learning, advanced algorithms, unsupervised learning, recommender systems, and reinforcement learning.",
            "category": "Machine Learning", "difficulty": "intermediate", "duration_mins": 600,
            "modules": [
                {"title": "Supervised Learning", "lessons": [
                    {"title": "Linear Regression", "type": "video", "url": "https://www.youtube.com/watch?v=jGwO_UgTS7I", "content": "<h2>Linear Regression</h2><p>The foundation of ML — understanding cost functions, gradient descent, and fitting linear models to data. Andrew Ng walks through the mathematics intuitively.</p><h3>Key Concepts</h3><ul><li>Hypothesis function</li><li>Cost function (MSE)</li><li>Gradient descent algorithm</li><li>Feature scaling & normalization</li><li>Multiple linear regression</li></ul>", "duration": 50},
                    {"title": "Logistic Regression & Classification", "type": "video", "url": "https://www.youtube.com/watch?v=hjrYrynGWGA", "content": "<h2>Classification with Logistic Regression</h2><p>Sigmoid function, decision boundaries, binary and multi-class classification, regularization to prevent overfitting.</p>", "duration": 45},
                    {"title": "Quiz: Supervised Learning", "type": "quiz", "duration": 10},
                ]},
                {"title": "Advanced Learning Algorithms", "lessons": [
                    {"title": "Neural Networks for ML", "type": "video", "url": "https://www.youtube.com/watch?v=Jy4wM2X21u0", "content": "<h2>Neural Networks</h2><p>Building neural networks from scratch — forward propagation, activation functions (ReLU, sigmoid, softmax), and training with TensorFlow.</p>", "duration": 55},
                    {"title": "Decision Trees & Ensemble Methods", "type": "video", "url": "https://www.youtube.com/watch?v=q90UDEgYqeI", "content": "<h2>Decision Trees & Random Forests</h2><p>Tree-based learning — splitting criteria, information gain, ensemble methods (bagging, boosting, XGBoost).</p>", "duration": 45},
                    {"title": "Quiz: Advanced Algorithms", "type": "quiz", "duration": 10},
                ]},
                {"title": "Unsupervised & Recommender Systems", "lessons": [
                    {"title": "Clustering & Anomaly Detection", "type": "video", "url": "https://www.youtube.com/watch?v=lDwow4aOrtg", "content": "<h2>Unsupervised Learning</h2><p>K-means clustering, anomaly detection, dimensionality reduction with PCA.</p>", "duration": 45},
                    {"title": "Recommender Systems", "type": "article", "content": "<h2>Recommender Systems</h2><p>How Netflix and Amazon recommend content using collaborative filtering and content-based filtering.</p><h3>Approaches</h3><ul><li><strong>Collaborative filtering</strong> — Users who liked X also liked Y</li><li><strong>Content-based</strong> — Recommend similar items based on features</li><li><strong>Deep learning recommenders</strong> — Neural collaborative filtering</li></ul>", "duration": 40},
                    {"title": "Final Assessment", "type": "quiz", "duration": 15},
                ]},
            ],
        },
        {
            "title": "Deep Learning Fundamentals",
            "description": "Comprehensive deep learning course covering neural network architectures, CNNs, RNNs, transformers, and practical implementation with TensorFlow and PyTorch.",
            "category": "Deep Learning", "difficulty": "advanced", "duration_mins": 480,
            "modules": [
                {"title": "Neural Network Foundations", "lessons": [
                    {"title": "Deep Learning Basics", "type": "video", "url": "https://www.youtube.com/watch?v=njKP3FqW3Sk", "content": "<h2>Introduction to Deep Learning</h2><p>MIT's introduction to deep learning — why depth matters, universal approximation theorem, computational graphs, and automatic differentiation.</p>", "duration": 50},
                    {"title": "Backpropagation Deep Dive", "type": "video", "url": "https://www.youtube.com/watch?v=Ilg3gGewQ5U", "content": "<h2>Backpropagation</h2><p>The mathematical backbone of training neural networks — chain rule, gradient flow, vanishing/exploding gradients, and optimization techniques (SGD, Adam, RMSProp).</p>", "duration": 45},
                    {"title": "Quiz: DL Foundations", "type": "quiz", "duration": 10},
                ]},
                {"title": "CNNs & Computer Vision", "lessons": [
                    {"title": "Convolutional Neural Networks", "type": "video", "url": "https://www.youtube.com/watch?v=iaSUYvmCekI", "content": "<h2>CNNs for Computer Vision</h2><p>Convolution operations, feature maps, pooling, stride, padding. Architectures: LeNet, AlexNet, VGG, ResNet, Inception.</p>", "duration": 55},
                    {"title": "Transfer Learning & Fine-tuning", "type": "article", "content": "<h2>Transfer Learning</h2><p>Use pre-trained models (ImageNet) and fine-tune for specific tasks. Dramatically reduces training time and data requirements.</p><h3>Steps</h3><ol><li>Choose a pre-trained model (ResNet, EfficientNet)</li><li>Freeze early layers (feature extractors)</li><li>Replace final classification layer</li><li>Fine-tune on your dataset</li></ol>", "duration": 30},
                    {"title": "Quiz: CNNs", "type": "quiz", "duration": 10},
                ]},
                {"title": "Sequence Models", "lessons": [
                    {"title": "RNNs, LSTMs & Transformers", "type": "video", "url": "https://www.youtube.com/watch?v=ySEx_Bqxvvo", "content": "<h2>Sequence Models</h2><p>From RNNs to Transformers — understanding sequential data processing, attention mechanisms, and why transformers revolutionized NLP and beyond.</p>", "duration": 55},
                    {"title": "Final Project Assessment", "type": "quiz", "duration": 15},
                ]},
            ],
        },
        {
            "title": "Generative AI & Large Language Models",
            "description": "Explore the world of generative AI — how LLMs work, prompt engineering, fine-tuning, RAG, AI agents, and building applications with GPT, Claude, and open-source models.",
            "category": "Generative AI", "difficulty": "intermediate", "duration_mins": 360,
            "modules": [
                {"title": "How LLMs Work", "lessons": [
                    {"title": "Transformer Architecture Explained", "type": "video", "url": "https://www.youtube.com/watch?v=zjkBMFhNj_g", "content": "<h2>Transformer Architecture</h2><p>The 'Attention is All You Need' paper brought us transformers. Understand self-attention, multi-head attention, positional encoding, and how these models generate text.</p><h3>Key Concepts</h3><ul><li>Self-attention mechanism</li><li>Query, Key, Value matrices</li><li>Multi-head attention</li><li>Positional encoding</li><li>Layer normalization & residual connections</li></ul>", "duration": 45},
                    {"title": "GPT, BERT & Modern LLMs", "type": "video", "url": "https://www.youtube.com/watch?v=UU1WVnMk4E8", "content": "<h2>Evolution of Language Models</h2><p>From word2vec to GPT-4 — understand the evolution: BERT (bidirectional), GPT (autoregressive), T5, LLaMA, and emergent capabilities at scale.</p>", "duration": 40},
                    {"title": "Quiz: LLM Fundamentals", "type": "quiz", "duration": 10},
                ]},
                {"title": "Prompt Engineering & Applications", "lessons": [
                    {"title": "Prompt Engineering Masterclass", "type": "video", "url": "https://www.youtube.com/watch?v=_ZvnD96BUHw", "content": "<h2>Prompt Engineering</h2><p>Techniques for getting the best results from LLMs: zero-shot, few-shot, chain-of-thought, ReAct, and systematic prompt design.</p>", "duration": 40},
                    {"title": "RAG & AI Agents", "type": "article", "content": "<h2>RAG & AI Agents</h2><p>Retrieval-Augmented Generation combines LLMs with external knowledge bases for accurate, up-to-date responses.</p><h3>RAG Pipeline</h3><ol><li><strong>Index</strong> — Chunk documents, create embeddings</li><li><strong>Retrieve</strong> — Find relevant chunks via vector similarity</li><li><strong>Generate</strong> — LLM produces answer using retrieved context</li></ol><h3>AI Agents</h3><p>LLMs that can use tools, browse the web, write code, and take actions autonomously. Frameworks: LangChain, AutoGPT, CrewAI.</p>", "duration": 35},
                    {"title": "Quiz: GenAI Applications", "type": "quiz", "duration": 10},
                ]},
            ],
        },
        {
            "title": "NLP with Deep Learning",
            "description": "Stanford CS224n — the gold standard NLP course. Covers word vectors, neural network models for NLP, attention, transformers, pretraining, and modern NLP applications.",
            "category": "NLP", "difficulty": "advanced", "duration_mins": 600,
            "modules": [
                {"title": "Word Vectors & Language Models", "lessons": [
                    {"title": "Word Vectors (Word2Vec, GloVe)", "type": "video", "url": "https://www.youtube.com/watch?v=rmVRLeJRkl4", "content": "<h2>Word Vectors</h2><p>Stanford CS224n Lecture 1 — How to represent words as dense vectors that capture semantic meaning. Word2Vec (CBOW, Skip-gram), GloVe, and evaluation methods.</p>", "duration": 75},
                    {"title": "Neural Language Models", "type": "video", "url": "https://www.youtube.com/watch?v=gqaHkPEZAew", "content": "<h2>Neural Language Models</h2><p>From n-grams to neural language models — feed-forward networks, RNNs for language modeling, perplexity, and the transition to modern approaches.</p>", "duration": 70},
                    {"title": "Quiz: Word Vectors", "type": "quiz", "duration": 10},
                ]},
                {"title": "Transformers & Pretraining", "lessons": [
                    {"title": "Attention & Transformers", "type": "video", "url": "https://www.youtube.com/watch?v=ptuGllU5SQQ", "content": "<h2>Attention Mechanisms</h2><p>The attention revolution — from seq2seq with attention to self-attention and the full transformer architecture. Why attention is the key innovation in modern NLP.</p>", "duration": 75},
                    {"title": "Pretraining & Fine-tuning", "type": "video", "url": "https://www.youtube.com/watch?v=DGfCRXuNA2w", "content": "<h2>Pretraining</h2><p>BERT, GPT, and the pretraining paradigm — masked language modeling, autoregressive pretraining, fine-tuning for downstream tasks, and few-shot learning.</p>", "duration": 70},
                    {"title": "Final NLP Assessment", "type": "quiz", "duration": 15},
                ]},
            ],
        },
    ]

    quiz_bank = {
        "Quiz: AI Fundamentals": [
            {"q": "What is machine learning?", "options": ["Programming computers with explicit rules", "Computers learning from data without explicit programming", "A type of robot", "A programming language"], "answer": "Computers learning from data without explicit programming"},
            {"q": "What type of ML uses labeled data?", "options": ["Unsupervised learning", "Reinforcement learning", "Supervised learning", "Transfer learning"], "answer": "Supervised learning"},
            {"q": "Which is NOT a common AI application?", "options": ["Image recognition", "Spam filtering", "Weather control", "Speech recognition"], "answer": "Weather control"},
        ],
        "Quiz: AI Projects": [
            {"q": "What is the first step in building an AI-first company?", "options": ["Hire a Chief AI Officer", "Execute pilot projects to gain momentum", "Buy the most expensive AI tools", "Replace all employees with AI"], "answer": "Execute pilot projects to gain momentum"},
            {"q": "What percentage of AI projects typically succeed?", "options": ["100%", "About 50-70%", "Less than 20%", "About 80-90%"], "answer": "About 50-70%"},
        ],
        "Quiz: Search & Knowledge": [
            {"q": "Which search algorithm always finds the shortest path?", "options": ["Depth-First Search", "Breadth-First Search", "Random Search", "Hill Climbing"], "answer": "Breadth-First Search"},
            {"q": "What algorithm is used for game-playing AI?", "options": ["A* Search", "Minimax", "BFS", "Dijkstra's"], "answer": "Minimax"},
            {"q": "A* search uses what to improve efficiency?", "options": ["Random guessing", "Brute force", "Heuristic function", "Backtracking"], "answer": "Heuristic function"},
        ],
        "Quiz: ML & Neural Networks": [
            {"q": "What is backpropagation?", "options": ["A way to store data", "Algorithm to calculate gradients for training", "A type of neural network", "A data preprocessing step"], "answer": "Algorithm to calculate gradients for training"},
            {"q": "What is a CNN primarily used for?", "options": ["Text processing", "Computer vision / image processing", "Audio processing", "Database queries"], "answer": "Computer vision / image processing"},
        ],
        "Final Assessment": [
            {"q": "What is attention in transformers?", "options": ["A way to focus on relevant parts of the input", "A type of activation function", "A loss function", "A data augmentation technique"], "answer": "A way to focus on relevant parts of the input"},
            {"q": "What does NLP stand for?", "options": ["Neural Language Protocol", "Natural Language Processing", "Network Learning Platform", "Numeric Logic Programming"], "answer": "Natural Language Processing"},
        ],
        "Quiz: Supervised Learning": [
            {"q": "What does gradient descent minimize?", "options": ["The model size", "The cost/loss function", "The dataset size", "The number of features"], "answer": "The cost/loss function"},
            {"q": "Logistic regression is used for?", "options": ["Regression only", "Classification problems", "Clustering", "Dimensionality reduction"], "answer": "Classification problems"},
            {"q": "What is overfitting?", "options": ["Model performs well on all data", "Model memorizes training data but fails on new data", "Model is too simple", "Model trains too slowly"], "answer": "Model memorizes training data but fails on new data"},
        ],
        "Quiz: Advanced Algorithms": [
            {"q": "What is an ensemble method?", "options": ["Using one powerful model", "Combining multiple models for better predictions", "A data collection technique", "A type of neural network"], "answer": "Combining multiple models for better predictions"},
            {"q": "XGBoost is an implementation of what?", "options": ["Neural networks", "Gradient boosted decision trees", "Support vector machines", "K-means clustering"], "answer": "Gradient boosted decision trees"},
        ],
        "Quiz: DL Foundations": [
            {"q": "What is the vanishing gradient problem?", "options": ["Gradients become too large", "Gradients shrink to near-zero in deep networks", "The network runs out of memory", "Training is too fast"], "answer": "Gradients shrink to near-zero in deep networks"},
            {"q": "ReLU activation function outputs?", "options": ["Values between 0 and 1", "max(0, x)", "Values between -1 and 1", "Always positive values"], "answer": "max(0, x)"},
        ],
        "Quiz: CNNs": [
            {"q": "What does a convolutional layer detect?", "options": ["Global patterns", "Local spatial features/patterns", "Temporal patterns", "Random noise"], "answer": "Local spatial features/patterns"},
            {"q": "What is transfer learning?", "options": ["Moving data between servers", "Using a pre-trained model for a new task", "Training from scratch", "Copying weights randomly"], "answer": "Using a pre-trained model for a new task"},
        ],
        "Final Project Assessment": [
            {"q": "Why did transformers replace RNNs?", "options": ["Transformers are smaller", "Parallel processing and better long-range dependencies", "RNNs were too accurate", "Transformers use less data"], "answer": "Parallel processing and better long-range dependencies"},
            {"q": "What is the key innovation in the transformer architecture?", "options": ["Convolutional layers", "Self-attention mechanism", "Recurrent connections", "Pooling layers"], "answer": "Self-attention mechanism"},
        ],
        "Quiz: LLM Fundamentals": [
            {"q": "What does GPT stand for?", "options": ["General Purpose Technology", "Generative Pre-trained Transformer", "Global Processing Tool", "Gradient Pre-Training"], "answer": "Generative Pre-trained Transformer"},
            {"q": "How do LLMs generate text?", "options": ["Looking up answers in a database", "Predicting the next token based on context", "Copy-pasting from the internet", "Using predefined templates"], "answer": "Predicting the next token based on context"},
        ],
        "Quiz: GenAI Applications": [
            {"q": "What is RAG?", "options": ["Random Answer Generation", "Retrieval-Augmented Generation", "Rapid AI Growth", "Recursive Algorithm Generator"], "answer": "Retrieval-Augmented Generation"},
            {"q": "What is few-shot prompting?", "options": ["Training with few data points", "Providing examples in the prompt to guide the model", "Using a small model", "Running inference quickly"], "answer": "Providing examples in the prompt to guide the model"},
        ],
        "Quiz: Word Vectors": [
            {"q": "What does Word2Vec produce?", "options": ["Word counts", "Dense vector representations of words", "Grammar rules", "Sentence structures"], "answer": "Dense vector representations of words"},
            {"q": "Words with similar meanings have what in vector space?", "options": ["Opposite directions", "Random positions", "Similar vector representations (close proximity)", "Zero vectors"], "answer": "Similar vector representations (close proximity)"},
        ],
        "Final NLP Assessment": [
            {"q": "BERT uses what type of pretraining?", "options": ["Autoregressive (left-to-right)", "Masked language modeling (bidirectional)", "Reinforcement learning", "Unsupervised clustering"], "answer": "Masked language modeling (bidirectional)"},
            {"q": "What makes transformers better than RNNs for NLP?", "options": ["They use less memory", "They process sequences in parallel with attention", "They are simpler to implement", "They don't need training data"], "answer": "They process sequences in parallel with attention"},
        ],
    }

    all_courses = []
    for cdata in courses_data:
        course = Course(
            title=cdata["title"], description=cdata["description"],
            category=cdata["category"], difficulty=cdata["difficulty"],
            duration_mins=cdata["duration_mins"], author_id=admin.id,
            status=CourseStatus.PUBLISHED,
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        all_courses.append(course)

        for mi, mdata in enumerate(cdata["modules"]):
            module = Module(course_id=course.id, title=mdata["title"], order_index=mi)
            db.add(module)
            db.commit()
            db.refresh(module)

            for li, ldata in enumerate(mdata["lessons"]):
                lesson_type = {"article": LessonType.ARTICLE, "video": LessonType.VIDEO, "quiz": LessonType.QUIZ}.get(ldata["type"], LessonType.ARTICLE)
                lesson = Lesson(
                    module_id=module.id, title=ldata["title"],
                    type=lesson_type, content=ldata.get("content", ""),
                    content_url=ldata.get("url", None),
                    duration_mins=ldata["duration"], order_index=li,
                )
                db.add(lesson)
                db.commit()
                db.refresh(lesson)

                if ldata["type"] == "quiz" and ldata["title"] in quiz_bank:
                    quiz = Quiz(lesson_id=lesson.id, pass_threshold=70.0, max_attempts=3)
                    db.add(quiz)
                    db.commit()
                    db.refresh(quiz)
                    for qdata in quiz_bank[ldata["title"]]:
                        db.add(Question(quiz_id=quiz.id, question_text=qdata["q"],
                                       options=qdata["options"], correct_answer=qdata["answer"]))
                    db.commit()

    # --- AI Learning Paths ---
    paths = [
        LearningPath(name="Company Onboarding & AI Baseline", description="Your personalized journey to getting started with us and our AI tools.", department=None, target_role="All Roles"),
        LearningPath(name="AI Foundations", description="Start your AI journey — from understanding AI concepts to programming AI systems with Python.", department=None, target_role="All Roles"),
        LearningPath(name="ML & Deep Learning Mastery", description="Master machine learning algorithms and deep learning architectures.", department="Engineering", target_role="ML Engineer"),
        LearningPath(name="Generative AI & NLP", description="Explore generative AI, large language models, and natural language processing.", department="Engineering", target_role="AI Engineer"),
    ]
    db.add_all(paths)
    db.commit()

    # Create PathSteps & Checkpoints for the Personalized "Company Onboarding & AI Baseline" Path
    # Core Step 1
    step1 = PathStep(path_id=paths[0].id, title="Welcome to the Company", description="Core orientation materials.", track=None, order_index=0)
    db.add(step1)
    db.commit()
    db.add_all([
        StepCheckpoint(step_id=step1.id, title="Watch CEO Welcome Video", type="video", is_required=True, content_url="https://www.youtube.com/embed/4eGap5q4GYg", order_index=0),
        StepCheckpoint(step_id=step1.id, title="Read Employee Handbook", type="article", is_required=True, content="Please read the attached employee handbook PDF guidelines carefully and acknowledge.", order_index=1),
    ])
    
    # Core Step 2
    step2 = PathStep(path_id=paths[0].id, title="AI Baseline Knowledge", description="Everyone needs to know the basics of AI.", track=None, order_index=1)
    db.add(step2)
    db.commit()
    db.add_all([
        StepCheckpoint(step_id=step2.id, title="Introduction to AI Overview", type="video", is_required=True, content_url="https://www.youtube.com/embed/ukzFI9rgwfU", order_index=0),
        StepCheckpoint(step_id=step2.id, title="AI Basics Quiz", type="quiz", is_required=True, order_index=1),
    ])

    # Tech Branch Step
    step3_tech = PathStep(path_id=paths[0].id, title="Engineering Tech Stack", description="Deep dive into our engineering tools and repositories.", track="Engineering", order_index=2)
    db.add(step3_tech)
    db.commit()
    db.add_all([
        StepCheckpoint(step_id=step3_tech.id, title="GitHub Setup", type="task", is_required=True, content="Clone the main repository and set up your local environment. Run the basic bootstrap commands.", order_index=0),
        StepCheckpoint(step_id=step3_tech.id, title="Architecture Overview", type="article", is_required=True, content="Review our microservices architecture documentation.", order_index=1),
    ])

    # Finance Branch Step
    step3_finance = PathStep(path_id=paths[0].id, title="Financial Compliance", description="Important compliance and reporting standards.", track="Finance", order_index=2)
    db.add(step3_finance)
    db.commit()
    db.add_all([
        StepCheckpoint(step_id=step3_finance.id, title="Compliance Training", type="video", is_required=True, content_url="https://www.youtube.com/embed/dQw4w9WgXcQ", order_index=0),
    ])

    # Ops Branch Step
    step3_ops = PathStep(path_id=paths[0].id, title="Operations Playbook", description="Mastering our operational workflows.", track="Operations", order_index=2)
    db.add(step3_ops)
    db.commit()
    db.add_all([
        StepCheckpoint(step_id=step3_ops.id, title="Incident Response Protocol", type="article", is_required=True, content="Read the P1 incident response playbook.", order_index=0),
    ])

    # Core Step 4
    step4 = PathStep(path_id=paths[0].id, title="Wrap-Up & Completion", description="Final check before you begin your journey.", track=None, order_index=3)
    db.add(step4)
    db.commit()
    db.add_all([
        StepCheckpoint(step_id=step4.id, title="Final Assessment Task", type="task", is_required=True, content="Tell us what you learned during onboarding and submit feedback.", order_index=0),
    ])
    db.commit()

    path_assignments = [
        (paths[1].id, [all_courses[0].id, all_courses[1].id]),
        (paths[2].id, [all_courses[2].id, all_courses[3].id]),
        (paths[3].id, [all_courses[4].id, all_courses[5].id]),
    ]
    for pid, cids in path_assignments:
        for i, cid in enumerate(cids):
            db.add(PathCourse(path_id=pid, course_id=cid, order_index=i))
    db.commit()

    # --- Enrollments (rich data for leaderboard) ---
    enrollments_data = [
        # Sarah Kim — top learner, 5 completed
        (learner1.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner1.id, all_courses[1].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner1.id, all_courses[2].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner1.id, all_courses[3].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner1.id, all_courses[4].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner1.id, all_courses[5].id, EnrollmentStatus.IN_PROGRESS, 60.0),
        # Ravi Kumar — 4 completed
        (learner6.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner6.id, all_courses[1].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner6.id, all_courses[2].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner6.id, all_courses[3].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner6.id, all_courses[4].id, EnrollmentStatus.IN_PROGRESS, 45.0),
        # Priya Mehta — 3 completed
        (learner3.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner3.id, all_courses[2].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner3.id, all_courses[3].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner3.id, all_courses[4].id, EnrollmentStatus.IN_PROGRESS, 55.0),
        # Lisa Park — 3 completed
        (learner7.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner7.id, all_courses[1].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner7.id, all_courses[5].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner7.id, all_courses[3].id, EnrollmentStatus.IN_PROGRESS, 30.0),
        # James Chen — 2 completed
        (learner4.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner4.id, all_courses[4].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner4.id, all_courses[2].id, EnrollmentStatus.IN_PROGRESS, 50.0),
        # Tom Rodriguez — 2 completed
        (learner2.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner2.id, all_courses[1].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner2.id, all_courses[3].id, EnrollmentStatus.IN_PROGRESS, 25.0),
        # Emily Watson — 1 completed
        (learner5.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner5.id, all_courses[5].id, EnrollmentStatus.IN_PROGRESS, 70.0),
        # Omar Hassan — 1 completed
        (learner8.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner8.id, all_courses[2].id, EnrollmentStatus.IN_PROGRESS, 15.0),

        # --- Additional learners ---
        # Aisha Patel — 4 completed (strong performer)
        (learner9.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner9.id, all_courses[1].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner9.id, all_courses[2].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner9.id, all_courses[4].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner9.id, all_courses[5].id, EnrollmentStatus.IN_PROGRESS, 40.0),
        # Daniel Wright — 3 completed
        (learner10.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner10.id, all_courses[2].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner10.id, all_courses[4].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner10.id, all_courses[3].id, EnrollmentStatus.IN_PROGRESS, 35.0),
        # Sofia Garcia — 3 completed
        (learner11.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner11.id, all_courses[1].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner11.id, all_courses[5].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner11.id, all_courses[3].id, EnrollmentStatus.IN_PROGRESS, 50.0),
        # Kevin Zhang — 2 completed
        (learner12.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner12.id, all_courses[3].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner12.id, all_courses[1].id, EnrollmentStatus.IN_PROGRESS, 65.0),
        # Nina Thompson — 2 completed
        (learner13.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner13.id, all_courses[4].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner13.id, all_courses[5].id, EnrollmentStatus.IN_PROGRESS, 20.0),
        # Marcus Brown — 4 completed (high achiever)
        (learner14.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner14.id, all_courses[1].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner14.id, all_courses[3].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner14.id, all_courses[5].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner14.id, all_courses[2].id, EnrollmentStatus.IN_PROGRESS, 75.0),
        # Yuki Tanaka — 1 completed
        (learner15.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner15.id, all_courses[4].id, EnrollmentStatus.IN_PROGRESS, 60.0),
        # Carlos Rivera — 3 completed
        (learner16.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner16.id, all_courses[1].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner16.id, all_courses[2].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner16.id, all_courses[4].id, EnrollmentStatus.IN_PROGRESS, 80.0),
        # Rachel Adams — 1 completed
        (learner17.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner17.id, all_courses[1].id, EnrollmentStatus.IN_PROGRESS, 30.0),
        # Hassan Ali — 5 completed (top tier)
        (learner18.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner18.id, all_courses[1].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner18.id, all_courses[2].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner18.id, all_courses[3].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner18.id, all_courses[5].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner18.id, all_courses[4].id, EnrollmentStatus.IN_PROGRESS, 55.0),
        # Megan Taylor — 2 completed
        (learner19.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner19.id, all_courses[2].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner19.id, all_courses[5].id, EnrollmentStatus.IN_PROGRESS, 45.0),
        # Andre Jackson — 2 completed
        (learner20.id, all_courses[0].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner20.id, all_courses[4].id, EnrollmentStatus.COMPLETED, 100.0),
        (learner20.id, all_courses[1].id, EnrollmentStatus.IN_PROGRESS, 55.0),
    ]
    for uid, cid, status, pct in enrollments_data:
        e = Enrollment(
            user_id=uid, course_id=cid, status=status, progress_pct=pct,
            assigned_by=hr.id,
            completion_date=datetime.utcnow() - timedelta(days=5) if status == EnrollmentStatus.COMPLETED else None,
        )
        db.add(e)
    db.commit()

    # --- Award badges based on completions ---
    badge_milestones = [
        (1, BadgeLevel.BRONZE, "Quick Starter", "Completed your first AI course"),
        (3, BadgeLevel.SILVER, "AI Explorer", "Completed 3 AI courses"),
        (5, BadgeLevel.GOLD, "AI Champion", "Completed 5 AI courses"),
    ]
    all_learners = [learner1, learner2, learner3, learner4, learner5, learner6, learner7, learner8,
                    learner9, learner10, learner11, learner12, learner13, learner14, learner15, learner16,
                    learner17, learner18, learner19, learner20]
    for user in all_learners:
        completed = sum(1 for uid, cid, s, p in enrollments_data if uid == user.id and s == EnrollmentStatus.COMPLETED)
        for req, level, title, desc in badge_milestones:
            if completed >= req:
                db.add(Badge(user_id=user.id, level=level, title=title, description=desc))
    db.commit()

    # --- Quiz Attempts (for leaderboard avg_score) ---
    # Get all quizzes from the DB
    all_quizzes = db.query(Quiz).all()
    quiz_attempts_data = []
    if all_quizzes:
        q0 = all_quizzes[0].id if len(all_quizzes) > 0 else None
        q1 = all_quizzes[1].id if len(all_quizzes) > 1 else None
        q2 = all_quizzes[2].id if len(all_quizzes) > 2 else None
        q3 = all_quizzes[3].id if len(all_quizzes) > 3 else None
        q4 = all_quizzes[4].id if len(all_quizzes) > 4 else None

        quiz_attempts_data = [
            # Sarah Kim — high scorer
            (learner1.id, q0, 95.0, True),
            (learner1.id, q1, 88.0, True),
            (learner1.id, q2, 92.0, True),
            (learner1.id, q3, 85.0, True),
            (learner1.id, q4, 90.0, True),
            # Ravi Kumar — very high
            (learner6.id, q0, 98.0, True),
            (learner6.id, q1, 92.0, True),
            (learner6.id, q2, 95.0, True),
            (learner6.id, q3, 88.0, True),
            # Priya Mehta — good
            (learner3.id, q0, 85.0, True),
            (learner3.id, q1, 78.0, True),
            (learner3.id, q2, 82.0, True),
            # Lisa Park — solid
            (learner7.id, q0, 90.0, True),
            (learner7.id, q1, 85.0, True),
            (learner7.id, q4, 88.0, True),
            # James Chen — decent
            (learner4.id, q0, 80.0, True),
            (learner4.id, q4, 75.0, True),
            # Tom Rodriguez — moderate
            (learner2.id, q0, 75.0, True),
            (learner2.id, q1, 70.0, True),
            # Emily Watson — beginner
            (learner5.id, q0, 82.0, True),
            # Omar Hassan — just starting
            (learner8.id, q0, 65.0, True),

            # --- Additional learners quiz attempts ---
            # Aisha Patel — strong scorer
            (learner9.id, q0, 91.0, True),
            (learner9.id, q1, 87.0, True),
            (learner9.id, q2, 89.0, True),
            (learner9.id, q4, 93.0, True),
            # Daniel Wright — solid
            (learner10.id, q0, 84.0, True),
            (learner10.id, q2, 79.0, True),
            (learner10.id, q4, 81.0, True),
            # Sofia Garcia — good
            (learner11.id, q0, 88.0, True),
            (learner11.id, q1, 82.0, True),
            (learner11.id, q4, 86.0, True),
            # Kevin Zhang — moderate
            (learner12.id, q0, 76.0, True),
            (learner12.id, q3, 71.0, True),
            # Nina Thompson — decent
            (learner13.id, q0, 79.0, True),
            (learner13.id, q4, 74.0, True),
            # Marcus Brown — high achiever
            (learner14.id, q0, 94.0, True),
            (learner14.id, q1, 91.0, True),
            (learner14.id, q3, 89.0, True),
            (learner14.id, q4, 92.0, True),
            # Yuki Tanaka — beginner
            (learner15.id, q0, 73.0, True),
            # Carlos Rivera — good
            (learner16.id, q0, 86.0, True),
            (learner16.id, q1, 83.0, True),
            (learner16.id, q2, 80.0, True),
            # Rachel Adams — beginner
            (learner17.id, q0, 70.0, True),
            # Hassan Ali — top tier
            (learner18.id, q0, 97.0, True),
            (learner18.id, q1, 94.0, True),
            (learner18.id, q2, 96.0, True),
            (learner18.id, q3, 91.0, True),
            (learner18.id, q4, 93.0, True),
            # Megan Taylor — moderate
            (learner19.id, q0, 77.0, True),
            (learner19.id, q2, 74.0, True),
            # Andre Jackson — decent
            (learner20.id, q0, 81.0, True),
            (learner20.id, q4, 78.0, True),
        ]

    for uid, qid, score, passed in quiz_attempts_data:
        if qid:
            db.add(QuizAttempt(user_id=uid, quiz_id=qid, score=score, passed=passed))
    db.commit()

    # --- Course Reviews ---
    reviews_data = [
        (learner1.id, all_courses[0].id, 5, "Amazing introduction to AI. The examples were very clear and practical."),
        (learner1.id, all_courses[1].id, 4, "Great content, but the pace is a bit fast towards the end."),
        (learner6.id, all_courses[0].id, 5, "I loved how intuitive everything felt. Highly recommended!"),
        (learner6.id, all_courses[2].id, 4, "Solid material on ML algorithms. I would have liked more coding exercises."),
        (learner3.id, all_courses[3].id, 5, "Deep learning explained beautifully. The visualizations helped a lot."),
        (learner7.id, all_courses[1].id, 3, "A bit too theoretical for my taste, better suited for researchers maybe."),
        (learner4.id, all_courses[4].id, 5, "LLMs finally make sense to me! The prompt engineering tips are gold."),
        (learner2.id, all_courses[0].id, 4, "Good overview. Expected more technical depth, but it's a foundations course."),
        (learner5.id, all_courses[0].id, 5, "Perfect for beginners. Feel much more confident discussing AI now."),
        (learner9.id, all_courses[5].id, 5, "Best NLP course out there. The assignments are challenging but rewarding."),
        (learner10.id, all_courses[2].id, 4, "Andrew Ng is a legend. Great course, though the math gets heavy."),
        (learner14.id, all_courses[3].id, 5, "Excellent deep dive into neural networks. Backprop is finally clear."),
        (learner18.id, all_courses[4].id, 5, "Building RAG systems was the highlight. Very practical and up-to-date."),
        (learner8.id, all_courses[0].id, 4, "Nice starting point. Ready to tackle more advanced topics now.")
    ]

    from app.models import CourseReview

    for uid, cid, rating, comment in reviews_data:
        review = CourseReview(
            user_id=uid,
            course_id=cid,
            rating=rating,
            comment=comment,
            created_at=datetime.utcnow() - timedelta(days=2) # offset time a bit
        )
        db.add(review)
    db.commit()

    # --- Skills ---
    skills_data = [
        ("Machine Learning", "AI", "intermediate"), ("Deep Learning", "AI", "advanced"),
        ("NLP", "AI", "advanced"), ("Computer Vision", "AI", "intermediate"),
        ("Generative AI", "AI", "intermediate"), ("Python for AI", "AI", "beginner"),
        ("Data Science", "AI", "beginner"), ("AI Strategy", "AI", "beginner"),
    ]
    skills = []
    for name, domain, level in skills_data:
        s = Skill(name=name, domain=domain, level=level)
        db.add(s)
        skills.append(s)
    db.commit()

    course_skill_map = [
        (all_courses[0].id, [7, 0]),
        (all_courses[1].id, [5, 0, 2]),
        (all_courses[2].id, [0, 6]),
        (all_courses[3].id, [1, 3]),
        (all_courses[4].id, [4, 2]),
        (all_courses[5].id, [2, 1]),
    ]
    for cid, skill_indices in course_skill_map:
        for si in skill_indices:
            db.add(CourseSkill(course_id=cid, skill_id=skills[si].id))
    db.commit()

    # --- Learning Needs Analysis (LNA) ---
    lna_data = [
        (learner4.id, "intermediate", ["Generative AI", "AI Strategy"], "I want to understand how GenAI can automate product documentation and support.", "hybrid", "2-4 hours"),
        (learner6.id, "intermediate", ["Deep Learning", "Computer Vision"], "Looking to transition into more vision-based ML projects.", "online", "5+ hours"),
        (learner7.id, "advanced", ["NLP", "Transformers"], "To fine-tune language models for domain-specific tasks.", "online", "2-4 hours"),
        (learner1.id, "advanced", ["AI Architecture", "MLOps"], "Learning how to deploy and scale AI models in production.", "in-person", "1-2 hours"),
        (learner8.id, "beginner", ["Python for AI", "Machine Learning"], "Getting foundational knowledge to start AI research.", "online", "5+ hours"),
        (learner10.id, "beginner", ["AI Strategy", "Analytics"], "Understanding how AI impacts marketing data analysis.", "hybrid", "1-2 hours"),
        (learner13.id, "intermediate", ["NLP", "AI Ethics"], "Building smarter chatbots for customer support while ensuring ethical use.", "online", "2-4 hours"),
        (learner15.id, "beginner", ["Generative AI"], "Using AI tools to assist in product design workflows.", "online", "1-2 hours")
    ]

    from app.models import LearningNeedAnalysis

    for uid, skill, interests, goals, fmt, time_commit in lna_data:
        lna = LearningNeedAnalysis(
            user_id=uid,
            current_skill_level=skill,
            areas_of_interest=interests,
            learning_goals=goals,
            preferred_format=fmt,
            weekly_time_commitment=time_commit,
            submitted_at=datetime.utcnow() - timedelta(days=3)
        )
        db.add(lna)
    db.commit()

    print("✅ VeLearn database seeded with AI courses!")
    print("   📧 Login credentials:")
    print("   Admin:   admin@company.com / admin123")
    print("   HR:      hr@company.com / hr123")
    print("   Learner: sarah@company.com / learner123")

    db.close()


if __name__ == "__main__":
    seed()
