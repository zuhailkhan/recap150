package lld_pub_sub_broker

import "fmt"

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
func runOps(ops []string, args [][]any) []any {
	var b *Broker
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "Broker":
			logs := map[string]Log{}
			for _, name := range a[0].([]any) {
				logs[name.(string)] = &MemoryLog{}
			}
			b = NewBroker(logs, NewOffsets())
			out = append(out, nil)
		case "publish":
			out = append(out, b.Publish(a[0].(string), a[1].(string)))
		case "poll":
			msgs, ok := b.Poll(a[0].(string), a[1].(string), int(a[2].(float64)))
			if !ok {
				out = append(out, -1)
				break
			}
			lines := []string{}
			for _, m := range msgs {
				lines = append(lines, fmt.Sprintf("%d:%s", m.Offset, m.Value))
			}
			out = append(out, lines)
		case "commit":
			out = append(out, b.Commit(a[0].(string), a[1].(string), int(a[2].(float64))))
		case "lag":
			out = append(out, b.Lag(a[0].(string), a[1].(string)))
		}
	}
	return out
}
