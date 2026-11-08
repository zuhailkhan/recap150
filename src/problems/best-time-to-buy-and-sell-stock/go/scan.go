package best_time_to_buy_and_sell_stock

func maxProfit(prices []int) int {
	buy := 0  // [1] index of the cheapest day seen so far
	best := 0 // [1] best profit seen so far
	for sell := 1; sell < len(prices); sell++ {
		if prices[sell] < prices[buy] { // [2] a cheaper day: buying here beats every earlier day
			buy = sell
			continue
		}
		best = max(best, prices[sell]-prices[buy]) // [3] sell today: profit against the cheapest day so far
	}
	return best // [4] 0 when prices only fall
}
