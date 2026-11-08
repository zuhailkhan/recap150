package hand_of_straights

import "sort"

func isNStraightHand(hand []int, groupSize int) bool {
	if len(hand)%groupSize != 0 {
		return false // [1] the cards cannot split into equal groups
	}
	count := map[int]int{} // [1] card value -> copies left in the hand
	for _, card := range hand {
		count[card]++
	}
	cards := make([]int, 0, len(count))
	for card := range count {
		cards = append(cards, card)
	}
	sort.Ints(cards) // [2] distinct values, smallest first (map order is random in Go)
	for _, x := range cards {
		for count[x] > 0 { // [3] x is the smallest card left, so it must start a group
			for k := 0; k < groupSize; k++ { // [4] take x, x + 1, ... one copy each
				if count[x+k] == 0 {
					return false
				}
				count[x+k]--
			}
		}
	}
	return true
}
