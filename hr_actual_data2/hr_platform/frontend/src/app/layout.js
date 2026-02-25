export const metadata = {
    title: 'VeLearn — AI Learning Platform',
    icons: {
        icon: '/vearc_logo.png',   // tab icon
        apple: '/vearc_logo.png',  // optional (iOS)
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
