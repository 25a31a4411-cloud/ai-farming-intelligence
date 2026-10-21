function fail(error, action) {
  if (error) throw new Error(`${action}: ${error.message}`);
}

export async function fetchNotifications(client) {
  const [notificationsResult, countResult] = await Promise.all([
    client.from("notifications")
      .select("id,notification_type,message,read_at,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    client.from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
  ]);
  fail(notificationsResult.error, "Could not load notifications");
  fail(countResult.error, "Could not count unread notifications");
  return {
    notifications: (notificationsResult.data || []).map((row) => ({
      id: row.id,
      type: row.notification_type,
      message: row.message,
      readAt: row.read_at,
      createdAt: row.created_at,
    })),
    unreadCount: countResult.count || 0,
  };
}

export async function markNotificationRead(client, notificationId) {
  if (!notificationId) throw new Error("Choose a notification to mark as read.");
  const { data, error } = await client.rpc("mark_notification_read", {
    target_notification_id: notificationId,
  });
  fail(error, "Could not mark notification as read");
  if (!data) throw new Error("The database did not confirm the notification update.");
  return data;
}
