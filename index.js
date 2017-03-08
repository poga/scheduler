/* globals prompt */
const vis = require('vis')
const moment = require('moment')
const yo = require('yo-yo')

// DOM element where the Timeline will be attached
var container = document.getElementById('vis')

// Create a DataSet (allows two way data-binding)
var items = new vis.DataSet([
  { id: 1, content: 'item 1', start: moment('2013-04-20'), end: moment('2013-04-21'), owner: 'foo' },
  { id: 2, itemType: 'step', content: 'Step 1', start: moment('2013-04-20'), style: 'background-color: grey; border: none; color: white' },
  { id: 4, content: 'item 4', start: moment('2013-04-16'), end: moment('2013-04-19') }
])

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
  },
  snap: (date, scale, step) => {
    // snap to start of a day
    return moment(date).hour(0).minute(0).second(0).millisecond(0)
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
            <tr class="bg-black-40 white-90">
              <th class="fw6 tl pa2">日期</th>
              <th class="fw6 tl pa2">工作項目</th>
              <th class="fw6 tl pa2">負責對象</th>
            </tr>
          </thead>
          ${tbody(items.get({order: sortItem}))}
        </table>
      </div>
    </div>
  `

  function sortItem (x, y) {
    var tx = moment(x.start)
    var ty = moment(y.start)
    console.log(x.content, tx.format(), y.content, ty.format())
    // 如果兩個 item 時間一樣，把 step 放前面
    if (tx.isSame(ty)) {
      console.log('same')
      return x.itemType !== 'step'
    }

    return moment(x.start).isAfter(moment(y.start))
  }
}

const tbody = (items) => {
  const styles = ['bg-white', 'bg-black-10']
  var currentStyle = 0
  console.log(items)

  var views = []
  items.forEach((item, i) => {
    if (item.itemType === 'step') {
      currentStyle = (currentStyle + 1) % styles.length
      return
    }

    views.push(itemView(item, i, styles[currentStyle]))
  })

  return yo`
    <tbody class="lh-copy">
      ${views}
    </tbody>
  `
}

const itemView = (item, i, style) => {
  return yo`
    <tr class="${style}">
      <td class="pa2">${formatDate(item.start)} - ${formatDate(item.end)}</td>
      <td class="pa2">${item.content}</td>
      <td class="pa2">${item.owner}</td>
    </tr>
  `
}

function formatDate (date) {
  return moment(date).format('YYYY.MM.DD')
}

function render () {
  yo.update(document.querySelector('#table'), view())
}

render()
