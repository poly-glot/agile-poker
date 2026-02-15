import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { getDatabase } from 'firebase-admin/database'
import { getApp, deleteApp } from 'firebase-admin/app'
import functionsTest from 'firebase-functions-test'
import { login, createRoom, cleanup } from './index.js'

const test = functionsTest()

describe('Firebase Cloud functions', () => {
  afterAll(async () => {
    test.cleanup()
    // Clean up firebase-admin app to prevent open handles
    try {
      const app = getApp()
      await deleteApp(app)
    } catch (e) {
      // App may not exist, ignore
    }
  })

  describe('Login', () => {
    let loginFunction

    beforeEach(() => {
      loginFunction = test.wrap(login)
    })

    describe('Should throw an error', () => {
      it('When username is empty', async () => {
        await expect(loginFunction({ data: { username: null } })).rejects.toThrow()
      })

      it('When username has more than 32 characters', async () => {
        await expect(loginFunction({ data: { username: 'a'.repeat(64) } })).rejects.toThrow()
      })

      it('When username contains non-alpha characters', async () => {
        await expect(loginFunction({ data: { username: 'name!' } })).rejects.toThrow()
      })
    })

    it('Should provide a token for valid username', async () => {
      await expect(loginFunction({ data: { username: 'name' } })).resolves.toEqual(expect.objectContaining({
        token: expect.any(String)
      }))
    })
  })

  describe('Create a new room', () => {
    let createRoomFunction

    beforeEach(() => {
      createRoomFunction = test.wrap(createRoom)
    })

    it('Should throw an error When user is not logged in', async () => {
      await expect(createRoomFunction({ auth: null })).rejects.toThrow()
    })

    it('Should generate a new auth token with room administration credentials when user is logged in', async () => {
      await expect(createRoomFunction({ auth: { uid: 'name' } })).resolves.toEqual(expect.objectContaining({
        token: expect.any(String),
        roomId: expect.any(String)
      }))
    })
  })

  describe('Cronjob to delete data every 24 hours', () => {
    let cleanupFunction
    let yearMonthDay

    beforeEach(async () => {
      cleanupFunction = test.wrap(cleanup)

      // Today Key
      const today = new Date()
      const year = today.getUTCFullYear()
      const month = today.getUTCMonth() + 1
      const day = today.getUTCDate()

      yearMonthDay = year + (month < 10 ? '0' + month : month) + (day < 10 ? '0' + day : day)

      // Test data
      const testData = {}
      testData['storyPoints/20210601/CA761233-ED42-11CE-BACD-00AA0057B124/userA'] = 1
      testData['storyPoints/20210601/CA761233-ED42-11CE-BACD-00AA0057B124/userB'] = 5
      testData['storyPoints/20211101/DA761233-ED42-11CE-BACD-00AA0057C125/userD'] = 8
      testData['storyPoints/20211103/DA761233-ED42-11CE-BACD-00AA0057C125/userD'] = 3

      testData[`storyPoints/${yearMonthDay}/DA761233-ED42-11CE-BACD-00AA0057C125/userX`] = 3
      testData[`storyPoints/${yearMonthDay}/DA761233-ED42-11CE-BACD-00AA0057C125/userY`] = 5
      testData[`storyPoints/${yearMonthDay}/DA761233-ED42-11CE-BACD-00AA0057C125/userZ`] = 8

      await getDatabase().ref().update(testData)
    })

    it('Should remove all historic data except today', async () => {
      await cleanupFunction({})
      const snapshot = await getDatabase().ref('storyPoints').get()
      const data = snapshot.val()
      const keys = Object.keys(data)

      expect(keys).toHaveLength(1)
      expect(keys).toEqual([yearMonthDay])
    })
  })
})
