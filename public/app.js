var loads=[["LED lights",10,8,5],["Ceiling fan",75,4,8],["Refrigerator",200,1,10],["TV",100,1,4],["Wi-Fi router",15,1,24],["Laptop",65,2,6]];
var $=function(i){return document.getElementById(i)};
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function rows(){
  $("rows").innerHTML=loads.map(function(l,i){
    return '<div class="cols"><input aria-label="Appliance" value="'+esc(l[0])+'" data-i="'+i+'" data-k="0">'
    +[1,2,3].map(function(k){return '<input type="number" min="0" step="any" aria-label="'+["","Watts","Quantity","Hours"][k]+'" value="'+l[k]+'" data-i="'+i+'" data-k="'+k+'">'}).join("")
    +'<button class="x" aria-label="Remove load" data-del="'+i+'">✕</button></div>';
  }).join("");
}
function n(id){return parseFloat($(id).value)||0}
function f(x,d){return x.toLocaleString("en-IN",{maximumFractionDigits:d==null?1:d})}
function tr(a){return a.map(function(r){return "<tr><td>"+r[0]+"</td><td>"+r[1]+"</td></tr>"}).join("")}
function calc(){
  var w=0,wh=0;
  loads.forEach(function(l){var p=(+l[1]||0)*(+l[2]||0);w+=p;wh+=p*(+l[3]||0)});
  var days=n("days"),V=n("volt"),dod=n("dod")/100,ie=n("inv")/100,be=n("bat")/100,mar=n("mar")/100,unit=n("unit"),psh=n("psh");
  if(!(days&&dod&&ie&&be&&unit&&V&&psh)){return}
  var acWh=wh*days, dcWh=acWh/ie;
  var nomWh=dcWh/(dod*be)*(1+mar);
  var ah=nomWh/V, units=Math.max(1,Math.ceil(ah/unit)), bankKwh=units*unit*V/1000;
  var usable=bankKwh*1000*dod*be/(1+mar), runH=w?usable*ie/w:0;
  var invKw=w/1000*1.25, amps=w/(V*ie), c=amps/(units*unit);
  var pv=dcWh/days/be/(psh*0.75)/1000;
  $("kwh").textContent=f(nomWh/1000,1)+" kWh";
  $("units").textContent=units+" × "+unit+" Ah at "+V+" V in parallel = "+f(bankKwh,1)+" kWh installed";
  $("bank").innerHTML=Array(units+1).join("<i></i>");
  $("t1").innerHTML=tr([["Daily backup energy",f(wh/1000,2)+" kWh"],["Connected load",f(w/1000,2)+" kW"],["Bank capacity",f(ah,0)+" Ah"],["Runtime at full load",f(runH,1)+" h"]]);
  $("t2").innerHTML=tr([["Inverter size (load + 25% margin)",f(invKw,1)+" kW"],["Max battery current",f(amps,0)+" A"],["Discharge rate",f(c,2)+" C"],["Solar to recharge daily energy",f(pv,1)+" kWp"],["Usable energy after losses",f(usable/1000,1)+" kWh"]]);
  var fl="";
  if(c>0.5)fl+='<div class="flag w">Discharge rate is above 0.5 C. Add battery units or spread the load across more inverters.</div>';
  else fl+='<div class="flag g">Discharge rate is within a comfortable range for LFP batteries.</div>';
  if(!w)fl='<div class="flag w">Add at least one load with watts and quantity.</div>';
  $("flags").innerHTML=fl;
}
document.addEventListener("input",function(e){
  var t=e.target;
  if(t.dataset&&t.dataset.i!==undefined){loads[t.dataset.i][t.dataset.k]=t.dataset.k==="0"?t.value:parseFloat(t.value)||0}
  calc();
});
document.addEventListener("click",function(e){
  var d=e.target.dataset;
  if(d&&d.del!==undefined){loads.splice(+d.del,1);rows();calc()}
});
$("add").onclick=function(){loads.push(["New load",100,1,4]);rows();calc()};
rows();calc();

if("serviceWorker" in navigator){
  window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").catch(function(){})});
}
