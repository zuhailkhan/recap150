package car_fleet

import "sort"

func carFleet(target int, position []int, speed []int) int {
	type car struct {
		pos  int
		time float64
	}
	cars := make([]car, len(position))
	for i := range position {
		cars[i] = car{position[i], float64(target-position[i]) / float64(speed[i])} // [1] hours each car needs if nothing blocks it
	}
	sort.Slice(cars, func(i, j int) bool { return cars[i].pos > cars[j].pos }) // [1] closest to the target first
	fleets := []float64{}                                                      // [2] arrival time of each fleet, nearest fleet at the bottom
	for _, c := range cars {
		if len(fleets) == 0 || c.time > fleets[len(fleets)-1] { // [3] slower than the fleet ahead: it can never catch up
			fleets = append(fleets, c.time)
		}
		// [4] otherwise it reaches the fleet ahead before the target and slows to its pace
	}
	return len(fleets) // [5] one stack entry per fleet
}
