export interface Memo {
	name: string
	uid: string
	content: string
	createTime: string
	updateTime: string
	visibility: "VISIBILITY_UNSPECIFIED" | "PRIVATE" | "PROTECTED" | "PUBLIC"
	resources?: MemoResource[]
}

export interface MemoResource {
	name: string
	uid: string
	filename: string
	type: string
	externalLink?: string
}

export interface MemosApiResponse {
	memos: Memo[]
	nextPageToken?: string
}
