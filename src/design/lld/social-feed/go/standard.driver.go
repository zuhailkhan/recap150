package lld_social_feed

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
func runOps(ops []string, args [][]any) []any {
	var svc *SocialFeed
	var inbox *Inbox
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "SocialFeed":
			var users []string
			for _, u := range a[0].([]any) {
				users = append(users, u.(string))
			}
			var strategy FeedStrategy = NewestFirst{}
			if a[1].(string) == "liked" {
				strategy = MostLiked{}
			}
			inbox = NewInbox()
			svc = NewSocialFeed(users, strategy, []LikeObserver{inbox})
			out = append(out, nil)
		case "follow":
			out = append(out, b2i(svc.Follow(a[0].(string), a[1].(string))))
		case "unfollow":
			out = append(out, b2i(svc.Unfollow(a[0].(string), a[1].(string))))
		case "post":
			out = append(out, svc.Post(a[0].(string), int(a[1].(float64))))
		case "like":
			out = append(out, b2i(svc.Like(a[0].(string), int(a[1].(float64)))))
		case "inbox":
			msgs := inbox.Of(a[0].(string))
			if msgs == nil {
				msgs = []string{}
			}
			out = append(out, msgs)
		case "feed":
			page := svc.Feed(a[0].(string), int(a[1].(float64)), a[2].(string))
			out = append(out, []any{page.IDs, page.Next})
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
