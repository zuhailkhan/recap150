package lld_notification_system

import (
	"errors"
	"slices"
)

type ChannelName string

// ChannelOrder is the fixed order a user's channels are tried in, so results are deterministic.
var ChannelOrder = []ChannelName{"email", "sms", "push"}

// Notification is a value object: what was published. It never changes after it is made.
type Notification struct {
	Topic string
	Body  string
}

type User struct {
	ID       string
	Channels []ChannelName // the channels this user wants, in any order
	Muted    bool
}

// Channel is one way to reach a user. Send returns an error when delivery fails.
type Channel interface {
	Send(userID string, n Notification) error
}

// RecordingChannel stands in for a real provider: it records what it sent, and can be told to fail.
// Email, SMS and push are three values of it, each with its own name.
type RecordingChannel struct {
	Name    ChannelName
	Failing bool
	Sent    []string
}

func (c *RecordingChannel) Send(userID string, n Notification) error {
	if c.Failing {
		return errors.New(string(c.Name) + " is down")
	}
	c.Sent = append(c.Sent, userID+":"+n.Topic)
	return nil
}

// Subscriptions maps topic to its user ids. A Go map iterates in random order,
// so each topic keeps a slice, which holds subscription order and is checked for duplicates.
type Subscriptions struct{ byTopic map[string][]string }

func NewSubscriptions() *Subscriptions { return &Subscriptions{byTopic: map[string][]string{}} }

func (s *Subscriptions) Add(topic, userID string) bool {
	if slices.Contains(s.byTopic[topic], userID) {
		return false
	}
	s.byTopic[topic] = append(s.byTopic[topic], userID)
	return true
}

func (s *Subscriptions) Remove(topic, userID string) bool {
	i := slices.Index(s.byTopic[topic], userID)
	if i < 0 {
		return false
	}
	s.byTopic[topic] = slices.Delete(s.byTopic[topic], i, i+1)
	return true
}

// Of returns a copy, so a change during delivery cannot disturb the loop.
func (s *Subscriptions) Of(topic string) []string { return slices.Clone(s.byTopic[topic]) }

type NotificationService struct {
	Failures []string // "channel:user" for every send that failed
	users    map[string]*User
	subs     *Subscriptions
	channels map[ChannelName]Channel
}

func NewNotificationService(users map[string]*User, subs *Subscriptions, channels map[ChannelName]Channel) *NotificationService {
	return &NotificationService{users: users, subs: subs, channels: channels}
}

func (s *NotificationService) Subscribe(userID, topic string) bool {
	if _, ok := s.users[userID]; !ok {
		return false
	}
	return s.subs.Add(topic, userID) // [1] record the subscription, once per user and topic
}

func (s *NotificationService) Unsubscribe(userID, topic string) bool {
	return s.subs.Remove(topic, userID) // [2] forget it, so later events skip this user
}

func (s *NotificationService) SetMuted(userID string, muted bool) bool {
	u, ok := s.users[userID]
	if ok {
		u.Muted = muted
	}
	return ok
}

// Publish returns "channel:user" for each delivery that worked: users in subscription order, channels in ChannelOrder.
func (s *NotificationService) Publish(topic, body string) []string {
	n := Notification{Topic: topic, Body: body}
	delivered := []string{}
	for _, id := range s.subs.Of(topic) { // [3] look up who follows this topic
		u := s.users[id]
		if u == nil || u.Muted { // [4] a muted user gets nothing
			continue
		}
		for _, name := range ChannelOrder {
			if !slices.Contains(u.Channels, name) {
				continue
			}
			if err := s.channels[name].Send(id, n); err != nil { // [5] one channel failing must not stop the others
				s.Failures = append(s.Failures, string(name)+":"+id)
				continue
			}
			delivered = append(delivered, string(name)+":"+id)
		}
	}
	return delivered
}
