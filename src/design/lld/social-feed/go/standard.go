package lld_social_feed

import (
	"cmp"
	"fmt"
	"regexp"
	"slices"
	"strconv"
)

// Time is an integer passed in by the caller. Nothing here reads a clock.
type Post struct {
	ID     int
	Author string
	At     int
	Likes  []string // who liked it, once each, in the order they did
}

// FeedStrategy: a higher score ranks first. Equal scores rank the newer post (larger ID) first, so the order is total.
type FeedStrategy interface {
	Score(p *Post) int
}

type NewestFirst struct{}

func (NewestFirst) Score(p *Post) int { return p.At }

type MostLiked struct{}

func (MostLiked) Score(p *Post) int { return len(p.Likes) }

type LikeObserver interface {
	Liked(p *Post, by string)
}

// Inbox is one observer: it collects "someone liked your post" messages per author.
type Inbox struct{ messages map[string][]string }

func NewInbox() *Inbox { return &Inbox{messages: map[string][]string{}} }

func (in *Inbox) Liked(p *Post, by string) {
	if by == p.Author { // liking your own post is not news
		return
	}
	in.messages[p.Author] = append(in.messages[p.Author], fmt.Sprintf("%s liked post %d", by, p.ID))
}

func (in *Inbox) Of(user string) []string { return slices.Clone(in.messages[user]) }

// Page is a page of post ids. Next is a cursor for the following page, or "" when there is no more.
type Page struct {
	IDs  []int
	Next string
}

type SocialFeed struct {
	following map[string][]string // user -> who they follow, in follow order
	byAuthor  map[string][]*Post
	posts     map[int]*Post
	nextID    int
	strategy  FeedStrategy
	observers []LikeObserver
}

// NewSocialFeed [1] makes known users that start with no follows and no posts.
func NewSocialFeed(users []string, strategy FeedStrategy, observers []LikeObserver) *SocialFeed {
	f := &SocialFeed{following: map[string][]string{}, byAuthor: map[string][]*Post{}, posts: map[int]*Post{}, nextID: 1, strategy: strategy, observers: observers}
	for _, u := range users {
		f.following[u] = []string{}
		f.byAuthor[u] = []*Post{}
	}
	return f
}

func (f *SocialFeed) Follow(me, other string) bool {
	mine, ok := f.following[me]
	if _, known := f.following[other]; !ok || !known || me == other || slices.Contains(mine, other) {
		return false
	}
	f.following[me] = append(mine, other) // [2] a one-way edge: me now sees other's posts
	return true
}

func (f *SocialFeed) Unfollow(me, other string) bool {
	i := slices.Index(f.following[me], other)
	if i < 0 {
		return false
	}
	f.following[me] = slices.Delete(f.following[me], i, i+1)
	return true
}

func (f *SocialFeed) Post(user string, at int) int {
	mine, ok := f.byAuthor[user]
	if !ok {
		return -1
	}
	p := &Post{ID: f.nextID, Author: user, At: at} // [3] ids count up, the timestamp comes from the caller
	f.nextID++
	f.byAuthor[user] = append(mine, p)
	f.posts[p.ID] = p
	return p.ID
}

func (f *SocialFeed) Like(user string, postID int) bool {
	p, ok := f.posts[postID]
	if _, known := f.following[user]; !ok || !known || slices.Contains(p.Likes, user) {
		return false
	}
	p.Likes = append(p.Likes, user)
	for _, o := range f.observers {
		o.Liked(p, user) // [4] tell every observer, once per new like
	}
	return true
}

var cursorRe = regexp.MustCompile(`^(\d+):(\d+)$`)

type ranked struct{ id, score int }

// Feed returns posts of the people you follow, ranked by the strategy, one page after the cursor.
func (f *SocialFeed) Feed(user string, limit int, cursor string) Page {
	var all []ranked
	for _, a := range f.following[user] {
		for _, p := range f.byAuthor[a] {
			all = append(all, ranked{p.ID, f.strategy.Score(p)}) // [5] score each post once, then order by score, then id
		}
	}
	slices.SortFunc(all, func(a, b ranked) int { return cmp.Or(cmp.Compare(b.score, a.score), cmp.Compare(b.id, a.id)) })
	at := cursorRe.FindStringSubmatch(cursor)
	if limit < 1 || (cursor != "" && at == nil) {
		return Page{IDs: []int{}}
	}
	rest := all
	if at != nil { // [6] keep what ranks after the cursor
		cs, _ := strconv.Atoi(at[1])
		ci, _ := strconv.Atoi(at[2])
		rest = nil
		for _, r := range all {
			if r.score < cs || (r.score == cs && r.id < ci) {
				rest = append(rest, r)
			}
		}
	}
	page := Page{IDs: []int{}}
	for _, r := range rest[:min(limit, len(rest))] {
		page.IDs = append(page.IDs, r.id)
	}
	if len(rest) > limit {
		last := rest[limit-1]
		page.Next = fmt.Sprintf("%d:%d", last.score, last.id)
	}
	return page
}
