import { remultApi } from 'remult/remult-sveltekit'
import { Research } from '$lib/entities/Research'
import { SearchController } from '$lib/controllers/SearchController'

export const api = remultApi({
	entities: [Research],
	controllers: [SearchController]
})
