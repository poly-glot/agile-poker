import { TeamStoryPoints } from './'

describe('TeamStoryPoints', () => {
  /** @type{TeamStoryPoints} * */
  let instance

  /** @type {Array<MemberEstimate>} */
  const members = [
    { name: 'Ali', points: '3' },
    { name: 'Oliver', points: '11' },
    { name: 'Harry', points: 5 },
    { name: 'George', points: '8' },
    { name: 'Jack', points: '3' },
    { name: 'Oscar', points: '3' }
  ]

  beforeEach(() => {
    instance = new TeamStoryPoints(document.querySelector('.team-story-points'))
  })

  describe('TeamStoryPoints.render()', () => {
    it('Does not show any thing when list is empty or not an array', () => {
      expect(instance.render()).toBeUndefined()
      expect(instance.render([])).toBeUndefined()
      expect(instance.render('abc')).toBeUndefined()
    })

    it('Compose list by story points', () => {
      expect(instance.render(members, true)).toMatchInlineSnapshot(`
"
                  <div class=\\"team-story-points__entry\\">
                    <div class=\\"team-story-points__name\\" data-cy=\\"name\\">Oliver</div>
                    <div class=\\"team-story-points__points\\" data-cy=\\"points\\">11</div>
                  </div>
                
                  <div class=\\"team-story-points__entry\\">
                    <div class=\\"team-story-points__name\\" data-cy=\\"name\\">George</div>
                    <div class=\\"team-story-points__points\\" data-cy=\\"points\\">8</div>
                  </div>
                
                  <div class=\\"team-story-points__entry\\">
                    <div class=\\"team-story-points__name\\" data-cy=\\"name\\">Harry</div>
                    <div class=\\"team-story-points__points\\" data-cy=\\"points\\">5</div>
                  </div>
                
                  <div class=\\"team-story-points__entry\\">
                    <div class=\\"team-story-points__name\\" data-cy=\\"name\\">Ali, Jack, Oscar</div>
                    <div class=\\"team-story-points__points\\" data-cy=\\"points\\">3</div>
                  </div>
                "
`)
    })

    it('Show loading indicator against team member who has not pointed', () => {
      const members2 = [...members]
      members2[0].points = ''
      members2[1].points = '-1'
      members2[2].points = -1

      expect(instance.render(members2, true)).toMatchInlineSnapshot(`
"
                  <div class=\\"team-story-points__entry\\">
                    <div class=\\"team-story-points__name\\" data-cy=\\"name\\">George</div>
                    <div class=\\"team-story-points__points\\" data-cy=\\"points\\">8</div>
                  </div>
                
                  <div class=\\"team-story-points__entry\\">
                    <div class=\\"team-story-points__name\\" data-cy=\\"name\\">Jack, Oscar</div>
                    <div class=\\"team-story-points__points\\" data-cy=\\"points\\">3</div>
                  </div>
                
                  <div class=\\"team-story-points__entry\\">
                    <div class=\\"team-story-points__name\\" data-cy=\\"name\\">Oliver</div>
                    <div class=\\"team-story-points__points\\" data-cy=\\"points\\">
                      <div class=\\"team-story-points__userwaiting\\">
                        <div class=\\"team-story-points__label\\">Waiting</div>
                        <img src=\\"/assets/loading.gif\\" alt=\\"Waiting\\" class=\\"team-story-points__icon\\" width=\\"20px\\" height=\\"20px\\">
                      </div>
                      
                    </div>
                  </div>
                
                  <div class=\\"team-story-points__entry\\">
                    <div class=\\"team-story-points__name\\" data-cy=\\"name\\">Harry</div>
                    <div class=\\"team-story-points__points\\" data-cy=\\"points\\">
                      <div class=\\"team-story-points__userwaiting\\">
                        <div class=\\"team-story-points__label\\">Waiting</div>
                        <img src=\\"/assets/loading.gif\\" alt=\\"Waiting\\" class=\\"team-story-points__icon\\" width=\\"20px\\" height=\\"20px\\">
                      </div>
                      
                    </div>
                  </div>
                "
`)
    })
  })
})
