package encode_and_decode_strings

func roundTrip(strs []string) []string {
	return decodeList(encodeList(strs))
}
