import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        404
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        That route doesn&apos;t exist. You can head home, start a chat, or reach crisis resources.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link to="/">Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/chat">Open chat</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/help">Get help now</Link>
        </Button>
      </div>
    </div>
  )
}

export default NotFound
