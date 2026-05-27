export interface Memo {
	name: string
	uid: string
	content: string
	createTime: string
	updateTime: string
	visibility: "VISIBILITY_UNSPECIFIED" | "PRIVATE" | "PROTECTED" | "PUBLIC"
	attachments?: MemoAttachment[]
}

export interface MemoAttachment {
	id: number
	name: string
	uid: string
	filename: string
	type: string
	size: number
	externalLink?: string
}

export interface MemosApiResponse {
	memos: Memo[]
	nextPageToken?: string
}
