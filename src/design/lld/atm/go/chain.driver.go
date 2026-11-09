package lld_atm

import (
	"strconv"
	"strings"
)

func fmtNotes(ns []Note) string {
	parts := make([]string, len(ns))
	for i, n := range ns {
		parts[i] = strconv.Itoa(n.Denom) + "x" + strconv.Itoa(n.N)
	}
	return strings.Join(parts, " ")
}

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
func runOps(ops []string, args [][]any) []any {
	var m *ATM
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "ATM":
			bank := NewBank(int(a[2].(float64)), int(a[3].(float64)))
			for _, r := range a[0].([]any) {
				row := r.([]any)
				bank.AddAccount(row[0].(string), row[1].(string), int(row[2].(float64)))
			}
			d := NewDispenser()
			for _, r := range a[1].([]any) {
				row := r.([]any)
				d.AddNote(int(row[0].(float64)), int(row[1].(float64)))
			}
			m = NewATM(bank, d)
			out = append(out, nil)
		case "insertCard":
			out = append(out, m.InsertCard(a[0].(string)))
		case "enterPin":
			out = append(out, string(m.EnterPin(a[0].(string))))
		case "withdraw":
			if notes, err := m.Withdraw(int(a[0].(float64))); err != nil {
				out = append(out, "refused:"+err.Error())
			} else {
				out = append(out, fmtNotes(notes))
			}
		case "checkBalance":
			if b, ok := m.CheckBalance(); ok {
				out = append(out, b)
			} else {
				out = append(out, -1)
			}
		case "eject":
			out = append(out, m.Eject())
		}
	}
	return out
}
