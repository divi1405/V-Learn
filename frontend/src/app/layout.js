export const metadata = {
    title: 'VeLearn — AI Learning Platform',
    icons: {
        icon: '/vearc_logo.png',   // vearc-tab icon
        apple: '/vearc_logo.png',  // optional (iOS)
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet" />
            </head>
            <body>{children}</body>
        </html>
    );
}
