package two_sum_ii_input_array_is_sorted

func twoSum(numbers []int, target int) []int {
	l, r := 0, len(numbers)-1 // [1] smallest value on the left, largest on the right
	for l < r {
		sum := numbers[l] + numbers[r] // [2] add the two ends
		if sum == target {             // [5] found it
			return []int{l + 1, r + 1}
		}
		if sum < target { // [3] too small: even the biggest partner is not enough for numbers[l]
			l++
		} else { // [4] too big: even the smallest partner is too much for numbers[r]
			r--
		}
	}
	return nil
}
