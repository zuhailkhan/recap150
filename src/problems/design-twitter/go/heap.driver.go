package design_twitter

import "fmt"

// run replays the operations. One result per operation: nil, except GetNewsFeed which returns the tweet ids.
func run(ops []string, args [][]int) []any {
	var tw *Twitter
	out := make([]any, 0, len(ops))
	for i, op := range ops {
		a := args[i]
		switch op {
		case "Twitter":
			tw = newTwitter()
			out = append(out, nil)
		case "postTweet":
			tw.PostTweet(a[0], a[1])
			out = append(out, nil)
		case "follow":
			tw.Follow(a[0], a[1])
			out = append(out, nil)
		case "unfollow":
			tw.Unfollow(a[0], a[1])
			out = append(out, nil)
		case "getNewsFeed":
			out = append(out, tw.GetNewsFeed(a[0]))
		default:
			panic(fmt.Sprintf("unknown operation %s", op))
		}
	}
	return out
}
