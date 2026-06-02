import { getNotifications } from '@/lib/services/notification/service'
import { NotificationsView } from './notifications-view'

export default async function NotificationsPage() {
  const notifications = await getNotifications({ limit: 100 })
  return <NotificationsView notifications={notifications} />
}
