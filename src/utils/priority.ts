export function priorityHigher(...others: number[]) {
	return Math.max(...others, 100) + 1;
}

export function priorityLower(...others: number[]) {
	return Math.min(...others, 100) - 1;
}
