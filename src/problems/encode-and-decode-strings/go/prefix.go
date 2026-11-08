package encode_and_decode_strings

import (
	"strconv"
	"strings"
)

func encodeList(strs []string) string {
	var sb strings.Builder
	for _, s := range strs {
		sb.WriteString(strconv.Itoa(len(s))) // [1] length, then '#', then the word itself
		sb.WriteByte('#')
		sb.WriteString(s)
	}
	return sb.String()
}

func decodeList(s string) []string {
	res := []string{}
	i := 0
	for i < len(s) {
		j := i
		for j < len(s) && s[j] != '#' { // [2] the digits run up to the first '#'
			j++
		}
		n, _ := strconv.Atoi(s[i:j])
		res = append(res, s[j+1:j+1+n]) // [3] take exactly n bytes, whatever they are
		i = j + 1 + n                   // [4] jump past the word to the next length
	}
	return res
}
