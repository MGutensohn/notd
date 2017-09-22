row = 0;
var event = null;
var startState = remote.getGlobal('startState');
var spacecraft_num = remote.getGlobal('scn');
var nominalData = null;
db.all("SELECT * FROM dsn_sfp where spacecraft_id = ?",{1:spacecraft_num}, function(err, data){
  if(typeof data === 'undefined'){
    console.log("no data: ",err);
  }else{
    nominalData = data;
  }
});


document.getElementById("spacecraft_name").textContent = remote.getGlobal('spaceCraft');
document.getElementById("spacecraft").textContent = '0' + remote.getGlobal('scn');
document.getElementById("if_switch").textContent = remote.getGlobal('dss');
document.getElementById("predict_mode").innerHTML += remote.getGlobal('predictMode');


var wait = setInterval(() => {
    if(remote.getGlobal('start')){
      setInterval(sendData, 2000);
      clearInterval(wait);
  }
}, 25);

function sendData(){
  if(row > nominalData.length){
    row = 0;
  }
  update(nominalData[row]);
  row++;
}

function update(data){
  var el;
  var val;
  event = remote.getGlobal('event');
  startState = remote.getGlobal('startState');

  for(key in data){
    val = data[key];
    el = document.getElementById(key);
    if(startState !== null && startState.hasOwnProperty(key) && !(event.hasOwnProperty(key))){
      val = simTools.handleSimEvent(el, val, startState[key]);
    }
    if(event.hasOwnProperty(key)){
      val = simTools.handleSimEvent(el, val, event[key]);
    }

    if(el !== null && val !== null){

      if(typeof val === 'number' && val % 1 !== 0){
        val = truncateToSize(el, val);
      }
      if(Math.random() > .3){
        el.textContent = val;
      }
      updateStatusOfElementAndNeighbors(el);
    }
  }

  for(key in startState){
    simTools.handleSimEvent(document.getElementById(key), key.textContent, startState[key]);
  }
}

function truncateToSize(element, value){
  var ref = document.getElementById("ref");
  var tmp = null;

  if(ref === null){
    document.body.innerHTML += ("<span id=\"ref\" " +
                  "class=\"dsn_data_field\" " +
                  "style=\"visibility:hidden; position:absolute;\"></span>");
    ref = document.getElementById("ref");
  }

  tmp = value.toString();
  ref.textContent = tmp;
  while(ref.getBoundingClientRect().width > element.getBoundingClientRect().width){
    tmp = tmp.substring(0, tmp.length - 1);
    ref.textContent = tmp;
  }
  return tmp;
}

function updateStatusOfElementAndNeighbors(el){
  if(el.id.includes('status')){
    switch (el.textContent) {
      case "OUT OF LOCK":
        if(el.classList.contains("status_good") || el.classList.contains("status_neutral")){
          el.classList.remove("status_neutral");
          el.classList.remove("status_good");
          el.classList.add("status_bad");
          var sibling = el.nextElementSibling;
          while(sibling){
            if (sibling.id.includes(el.id.substr(0, el.id.indexOf('_'))) &&
            sibling.className.split(' ').some(c => /status_.*/.test(c))){
              sibling.classList.remove("status_good");
              sibling.classList.add("status_neutral");
            }
            sibling = sibling.nextElementSibling;
          }

        }
        break;
        case "IN LOCK":
          el.classList.remove("status_neutral");
          el.classList.remove("status_bad");
          el.classList.add("status_good");
          var sibling = el.nextElementSibling;
          while(sibling){
            if (sibling.id.includes(el.id.substr(0, el.id.indexOf('_'))) &&
              sibling.className.split(' ').some(c => /status_.*/.test(c))){
              sibling.classList.remove("status_neutral");
              sibling.classList.add("status_good");
            }
            sibling = sibling.nextElementSibling;
          }
          break;
        default:
          el.classList.remove("status_bad");
          el.classList.remove("status_good");
          el.classList.remove("status_yellow");
          el.classList.add("status_neutral");
    }
  }
}
