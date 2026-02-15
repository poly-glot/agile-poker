import { describe, it, expect } from 'vitest'

describe('Example', () => {
  it('Should load index.html by default', async () => {
    expect(document.querySelector('body')).toBeTruthy()
  })
})
