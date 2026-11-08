package find_the_duplicate_number

func findDuplicate(nums []int) int {
	slow, fast := 0, 0 // [1] treat each index as a node: i points to nums[i]. Start at index 0
	for {
		slow = nums[slow]       // [2] slow takes one step
		fast = nums[nums[fast]] // [2] fast takes two
		if slow == fast {
			break // [2] they met inside the loop
		}
	}
	slow = 0 // [3] restart slow at the beginning. fast stays where they met
	for slow != fast {
		slow = nums[slow] // [3] the two walkers now meet exactly where the loop starts
		fast = nums[fast]
	}
	return slow // [4] the loop entrance is the duplicate value
}
