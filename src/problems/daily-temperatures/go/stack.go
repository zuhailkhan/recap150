package daily_temperatures

func dailyTemperatures(temps []int) []int {
	answer := make([]int, len(temps)) // [1] 0 means no warmer day ahead
	stack := []int{}                  // [1] indices of days still waiting for a warmer day
	for i, temp := range temps {
		for len(stack) > 0 && temp > temps[stack[len(stack)-1]] { // [2] today is warmer than the waiting day on top
			j := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			answer[j] = i - j // [2] that day has waited i - j days
		}
		stack = append(stack, i) // [3] today now waits for a warmer day
	}
	return answer // [4] days still on the stack keep 0
}
