const firebase = require('@firebase/rules-unit-testing')

describe('Firebase Database Testing', () => {
  describe('Anonymous users', () => {
    let db

    beforeEach(() => {
      db = authedApp(null)
    })

    it('Disallow all Read actions', async () => {
      await firebase.assertFails(db.ref('tokens/test-data').once('value'))
      await firebase.assertFails(db.ref('storyPoints').once('value'))
      await firebase.assertFails(db.ref('storyPoints/202106').once('value'))
    })

    it('Disallow all write actions', async () => {
      await firebase.assertFails(db.ref('storyPoints/202106/CA761233-ED42-11CE-BACD-00AA0057B124/Junaid A').set(1))
    })

    it('Disallow all delete actions', async () => {
      await firebase.assertFails(db.ref('storyPoints/202106/CA761233-ED42-11CE-BACD-00AA0057B124/Junaid A').remove())
    })
  })

  describe('Normal users', () => {
    let db

    beforeEach(() => {
      db = authedApp({ uid: 'Junaid A' })
    })

    describe('Allowed action', () => {
      it('Read: Story points for a room', async () => {
        await firebase.assertSucceeds(db.ref('storyPoints/20210601/CA761233-ED42-11CE-BACD-00AA0057B124').once('value'))
      })

      it('Write: Add a story point', async () => {
        await firebase.assertSucceeds(db.ref('storyPoints/20210601/CA761233-ED42-11CE-BACD-00AA0057B124/Junaid A').set(1))
        await firebase.assertFails(db.ref('storyPoints/20210601/CA761233-ED42-11CE-BACD-00AA0057B124/revealPoints').set(1))
      })

      it('Delete: Own story point', async () => {
        await firebase.assertSucceeds(db.ref('storyPoints/20210601/CA761233-ED42-11CE-BACD-00AA0057B124/Junaid A').remove())
      })
    })

    describe('Disallowed action', () => {
      it('Read: to a root level', async () => {
        await firebase.assertFails(db.ref('storyPoints/20210601').once('value'))
      })

      it('Write: Add a story point at random location', async () => {
        await firebase.assertFails(db.ref('test-data/my-number').set(1))
      })

      it('Validation: when story point is not a number', async () => {
        await firebase.assertFails(db.ref('storyPoints/20210601/CA761233-ED42-11CE-BACD-00AA0057B124/Junaid A').set({ x: 1 }))
      })

      it('Delete: Random location', async () => {
        await firebase.assertFails(db.ref('test-data/my-number').remove())
      })
    })
  })

  describe('Data validations', () => {
    let db

    beforeEach(() => {
      db = authedApp({ uid: 'Junaid A' })
    })

    describe('Ensure $yearMonth is respected as YYYYMD', () => {
      describe.each([
        [102106],
        [20211],
        ['xyz']
      ])('when value is %s', (value) => {
        it('then it will fail as it does not match the security rule', async () => {
          await firebase.assertFails(db.ref(`storyPoints/${value}/CA761233-ED42-11CE-BACD-00AA0057B124/Junaid A`).set(1))
        })
      })

      it('Succeeded when it matches the pattern', async () => {
        await firebase.assertSucceeds(db.ref('storyPoints/20210601/CA761233-ED42-11CE-BACD-00AA0057B124/Junaid A').set(1))
      })
    })

    describe('Ensure $uniqueRoom is respected as UUID', () => {
      it('Fails when it does not match the pattern', async () => {
        await firebase.assertFails(db.ref('storyPoints/20210601/HelloWorld/Junaid A').set(1))
      })

      it('Succeeded when it matches the pattern', async () => {
        await firebase.assertSucceeds(db.ref('storyPoints/20210601/CA761233-ED42-11CE-BACD-00AA0057B124/Junaid A').set(1))
        await firebase.assertSucceeds(db.ref('storyPoints/20210631/CA761233-ED42-11CE-BACD-00AA0057B124/Junaid A').set(1))
        await firebase.assertSucceeds(db.ref('storyPoints/20211231/CA761233-ED42-11CE-BACD-00AA0057B124/Junaid A').set(1))
      })
    })
  })

  describe('Room Admin actions', () => {
    let db

    beforeEach(() => {
      db = authedApp({ uid: 'Junaid A', roomAdmin: 'CA761233-ED42-11CE-BACD-00AA0057B124' })
    })

    it('As a room admin should be able to trigger reveal points', async () => {
      await firebase.assertSucceeds(db.ref('storyPoints/20210601/CA761233-ED42-11CE-BACD-00AA0057B124/revealPoints').set(1))
    })

    it('Should not be able to reveal points on other rooms', async () => {
      await firebase.assertFails(db.ref('storyPoints/20210601/CA761233-ED42-11CE-BACD-00AA0055B555/revealPoints').set(1))
    })
  })
})
