import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ClassCardProps {
  classData: {
    id: string
    name: string
    created_at: string
  }
}

export function ClassCard({ classData }: ClassCardProps) {
  const createdDate = new Date(classData.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📚</span>
          <span className="text-orange-600">{classData.name}</span>
        </CardTitle>
        <CardDescription>Created {createdDate}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href={`/app/teacher/classes/${classData.id}`}>
          <Button className="w-full" variant="outline">
            View Roster
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
