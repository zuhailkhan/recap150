package gas_station

func canCompleteCircuit(gas []int, cost []int) int {
	total := 0 // [1] gas minus cost over the whole circle
	tank := 0  // [1] fuel in the tank since the current start
	start := 0 // [1] the station we are trying to start from
	for i := range gas {
		gain := gas[i] - cost[i] // [2] fuel gained here minus fuel needed for the next leg
		total += gain
		tank += gain
		if tank < 0 { // [3] ran dry: no station from start to i can be a good start
			start = i + 1
			tank = 0
		}
	}
	if total < 0 {
		return -1 // [4] less gas than the trip costs: no start works
	}
	return start // [4] enough fuel overall: the last restart is the answer
}
