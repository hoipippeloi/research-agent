import { Entity, Fields } from 'remult'

@Entity('research', {
	allowApiCrud: true
})
export class Research {
	@Fields.uuid()
	id!: string

	@Fields.createdAt()
	createdAt!: Date

	@Fields.string({ required: true })
	query = ''

	@Fields.object()
	results: SearchResult[] = []
}

export interface SearchResult {
	title: string
	url: string
	content: string
	engine?: string
}
