import './globals.css'

export const metadata = {
  title: 'Exam Paper Platform',
  description: 'Generate RBSE & CBSE exam papers instantly',
}

export default function RootLayout({ children }) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  )
}
