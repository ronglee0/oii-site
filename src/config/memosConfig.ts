export type MemosConfig = {
	apiUrl: string
	accessToken?: string
	pageSize: number
}

export const memosConfig: MemosConfig = {
	apiUrl: "https://memos.745566.xyz",
	accessToken: import.meta.env.PUBLIC_MEMOS_ACCESS_TOKEN || "",
	pageSize: 20,
}
