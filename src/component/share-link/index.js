import AlertService from '../alert/alert'

document.getElementById('js-share-link').addEventListener('click', copyLink)

async function copyLink () {
  try {
    await navigator.clipboard.writeText(document.location.toString())
    AlertService.announce('Link copied')
  } catch (err) {
    AlertService.announce('Error - unable to copy link into the clipboard.')
  }
}
