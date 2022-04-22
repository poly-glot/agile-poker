import { step, TestSettings, By, Until } from '@flood/element'
import * as faker from 'faker'

//const baseUrl = 'http://localhost:8080';
const baseUrl = 'https://agile.junaid.guru'

const storyPoints = [
	'storyPoints1',
	'storyPoints2',
	'storyPoints4',
	'storyPoints5',
	'storyPoints8',
	'storyPoints13',
	'storyPoints20',
	'storyPoints40',
	'storyPoints100',
]

export const settings: TestSettings = {
	waitUntil: 'visible',
}

export default () => {
	step('Visit Homepage`', async browser => {
		await browser.visit(baseUrl)
	})

	step('Sign up', async browser => {
		await browser.type(By.css('#username'), faker.name.firstName())

		await browser.click(By.css('[data-cy=submit]'))
	})

	step('Create Room', async browser => {
		await browser.wait(Until.elementIsVisible(By.partialVisibleText('CREATE A ROOM')))

		await browser.click(By.css('[data-cy=submit]'))
	})

	step('Select Story Point Randomly', async browser => {
		const randomPoint = faker.random.arrayElement(storyPoints)

		await browser.wait(Until.elementIsEnabled(By.css('#' + randomPoint)))

		await browser.click(By.css('label[for=' + randomPoint + ']'))
	})

	step('Reveal Story points', async browser => {
		await browser.click(By.css('[data-cy=showStoryPoints]'))
		await browser.wait(
			Until.elementIsVisible(By.partialVisibleText('Story points are visible to the team')),
		)
	})

	step('Sign out', async browser => {
		await browser.click(By.css('[data-cy=signout]'))
		await browser.wait(Until.elementIsVisible(By.partialVisibleText('LOGIN')))
	})
}
