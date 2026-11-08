package lld_notification_system

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
func runOps(ops []string, args [][]any) []any {
	var svc *NotificationService
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "NotificationService":
			users := map[string]*User{}
			for _, row := range a[0].([]any) {
				r := row.([]any)
				u := &User{ID: r[0].(string), Muted: r[2].(float64) == 1}
				for _, c := range r[1].([]any) {
					u.Channels = append(u.Channels, ChannelName(c.(string)))
				}
				users[u.ID] = u
			}
			failing := map[string]bool{}
			for _, f := range a[1].([]any) {
				failing[f.(string)] = true
			}
			channels := map[ChannelName]Channel{}
			for _, name := range ChannelOrder {
				channels[name] = &RecordingChannel{Name: name, Failing: failing[string(name)]}
			}
			svc = NewNotificationService(users, NewSubscriptions(), channels)
			out = append(out, nil)
		case "subscribe":
			out = append(out, b2i(svc.Subscribe(a[0].(string), a[1].(string))))
		case "unsubscribe":
			out = append(out, b2i(svc.Unsubscribe(a[0].(string), a[1].(string))))
		case "mute":
			out = append(out, b2i(svc.SetMuted(a[0].(string), a[1].(float64) == 1)))
		case "publish":
			out = append(out, svc.Publish(a[0].(string), a[1].(string)))
		case "failures":
			f := svc.Failures
			if f == nil {
				f = []string{}
			}
			out = append(out, f)
		}
	}
	return out
}

func b2i(b bool) int {
	if b {
		return 1
	}
	return 0
}
