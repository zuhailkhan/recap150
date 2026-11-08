package best_time_to_buy_and_sell_stock_with_cooldown

func maxProfit(prices []int) int {
	n := len(prices)
	if n == 0 {
		return 0
	}
	hold := make([]int, n) // [1] hold[i]: best profit at the end of day i while owning a share
	sold := make([]int, n) // [1] sold[i]: best profit if I sold on day i
	rest := make([]int, n) // [1] rest[i]: best profit owning nothing, and I did not sell on day i
	hold[0] = -prices[0]   // [1] day 0: the only way to hold is to buy now. Selling is impossible, so sold and rest stay 0
	for i := 1; i < n; i++ {
		hold[i] = max(hold[i-1], rest[i-1]-prices[i]) // [2] keep holding, or buy today (only allowed after a rest day)
		sold[i] = hold[i-1] + prices[i]               // [3] sell the share I was holding yesterday
		rest[i] = max(rest[i-1], sold[i-1])           // [4] do nothing: stay resting, or finish yesterday's cooldown
	}
	return max(sold[n-1], rest[n-1]) // [5] finish owning nothing: sold on the last day or resting
}
