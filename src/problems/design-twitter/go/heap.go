package design_twitter

import "container/heap"

type tweet struct {
	time int // a global counter, so a bigger time means a newer tweet
	id   int
}

// candidate is one entry in the merge heap: a tweet, its author, and its position in that author's list.
type candidate struct {
	tweet
	user, at int
}

// newestFirst is a max-heap by time. Less says "i belongs above j", so > puts the newest on top.
// container/heap needs five methods: Len, Less, Swap, and Push and Pop that work on the LAST slice item.
type newestFirst []candidate

func (h newestFirst) Len() int           { return len(h) }
func (h newestFirst) Less(i, j int) bool { return h[i].time > h[j].time }
func (h newestFirst) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *newestFirst) Push(x any)        { *h = append(*h, x.(candidate)) }
func (h *newestFirst) Pop() any {
	old := *h
	last := old[len(old)-1]
	*h = old[:len(old)-1]
	return last
}

const feedSize = 10

type Twitter struct {
	clock   int
	tweets  map[int][]tweet      // user -> their tweets, oldest first
	follows map[int]map[int]bool // user -> the users they follow
}

func newTwitter() *Twitter {
	return &Twitter{tweets: map[int][]tweet{}, follows: map[int]map[int]bool{}}
}

func (tw *Twitter) PostTweet(userID, tweetID int) {
	// [1] stamp it with the clock and append: each list stays sorted by time
	tw.tweets[userID] = append(tw.tweets[userID], tweet{time: tw.clock, id: tweetID})
	tw.clock++
}

func (tw *Twitter) Follow(followerID, followeeID int) {
	if tw.follows[followerID] == nil {
		tw.follows[followerID] = map[int]bool{}
	}
	tw.follows[followerID][followeeID] = true // [2] a set, so following twice changes nothing
}

func (tw *Twitter) Unfollow(followerID, followeeID int) {
	delete(tw.follows[followerID], followeeID) // [2] deleting from a missing map or key is harmless
}

func (tw *Twitter) GetNewsFeed(userID int) []int {
	h := &newestFirst{}
	people := map[int]bool{userID: true} // you see your own tweets too
	for f := range tw.follows[userID] {
		people[f] = true
	}
	for user := range people {
		mine := tw.tweets[user]
		if len(mine) > 0 {
			heap.Push(h, candidate{tweet: mine[len(mine)-1], user: user, at: len(mine) - 1}) // [3] only each person's newest tweet can come first
		}
	}
	feed := []int{}
	for h.Len() > 0 && len(feed) < feedSize {
		top := heap.Pop(h).(candidate) // [4] the newest tweet among everyone's newest is the next feed entry
		feed = append(feed, top.id)
		if top.at > 0 {
			heap.Push(h, candidate{tweet: tw.tweets[top.user][top.at-1], user: top.user, at: top.at - 1}) // [5] that person's next older tweet becomes a candidate
		}
	}
	return feed
}
