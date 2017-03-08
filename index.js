/* globals prompt */
const vis = require('vis')
const moment = require('moment')
const yo = require('yo-yo')

// DOM element where the Timeline will be attached
var container = document.getElementById('vis')

// Create a DataSet (allows two way data-binding)
var items = new vis.DataSet([
  { id: 1, content: 'item 1', start: '2013-04-20', end: '2013-04-21', owner: 'foo' },
  { id: 2, content: 'Step 1', start: '2013-04-20' },
  { id: 4, content: 'item 4', start: '2013-04-16', end: '2013-04-19' }
])
items.on('*', (e, props, sender) => {
  console.log(e, props, sender)
})

// Configuration for the Timeline
var options = {
  editable: true,
  multiselect: true,
  timeAxis: { scale: 'day' },
  format: {
    majorLabels: {
      day: 'YYYY-MM'
    },
    minorLabels: {
      day: 'MM/DD'
    }
  },
  minHeight: 200,
  onAdd: (item, cb) => { item.end = moment(item.start).add(1, 'day'); cb(item) },
  onUpdate: (item, cb) => {
    item.content = prompt('Edit items text:', item.content)
    if (item.content != null) {
      cb(item) // send back adjusted item
    } else {
      cb(null) // cancel updating the item
    }
    updated()
  },
  onMove: (item, cb) => {
    cb(item)
    updated()
  }
}

// Create a Timeline
var timeline = new vis.Timeline(container, items, options)

function updated () {
  console.log(items)
  render()
}

const view = () => {
  return yo`
    <div class="pa4" id="table">
      <div class="overflow-auto">
        <table class="f6 w-100 mw8 center" cellspacing="0">
          <thead>
            <tr class="stripe-dark">
              <th class="fw6 tl pa3 bg-white">日期</th>
              <th class="fw6 tl pa3 bg-white">工作項目</th>
              <th class="fw6 tl pa3 bg-white">負責對象</th>
            </tr>
          </thead>
          <tbody class="lh-copy">
            ${items.get({order: (x, y) => moment(x.start).isAfter(moment(y.start))}).map(itemView)}
          </tbody>
        </table>
      </div>
    </div>
  `
}

const itemView = (item) => {
  return yo`
    <tr class="stripe-dark">
      <td class="pa3">${formatDate(item.start)} - ${formatDate(item.end)}</td>
      <td class="pa3">${item.content}</td>
      <td class="pa3">${item.owner}</td>
    </tr>
  `
}

function formatDate (date) {
  return moment(date).format('YYYY-MM-DD')
}

function render () {
  yo.update(document.querySelector('#table'), view())
}

render()
