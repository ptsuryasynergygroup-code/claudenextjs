'use client'

import { useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { markReadAction, markAllReadAction } from './_actions'
import type { NotificationDto } from '@/lib/entities/notification/schema'

export function NotificationsView({ notifications }: { notifications: NotificationDto[] }) {
  const [isPending, startTransition] = useTransition()
  const unread = notifications.filter((n) => n.readAt === null).length

  function onMarkRead(id: string) {
    startTransition(async () => {
      try {
        await markReadAction(id)
      } catch {
        toast.error('Action failed')
      }
    })
  }

  function onMarkAll() {
    startTransition(async () => {
      try {
        await markAllReadAction()
        toast.success('All marked as read')
      } catch {
        toast.error('Action failed')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">{unread} unread</p>
        </div>
        <Button variant="outline" disabled={isPending || unread === 0} onClick={onMarkAll}>
          <CheckCheck className="mr-2 size-4" />
          Mark all read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>{notifications.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-lg border p-4 ${
                  n.readAt === null ? 'bg-muted/40' : ''
                }`}
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Bell className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{n.title}</p>
                    {n.readAt === null && (
                      <Badge variant="outline" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                  </p>
                </div>
                {n.readAt === null && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    disabled={isPending}
                    onClick={() => onMarkRead(n.id)}
                  >
                    <Check className="size-4" />
                    <span className="sr-only">Mark read</span>
                  </Button>
                )}
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No notifications.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
