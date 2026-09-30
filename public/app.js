var LIB={L:[["LED bulb",10,.9,1],["LED tube light",20,.9,1],["Wi-Fi router",15,.9,1],["TV",100,.9,1],["Laptop",65,.9,1],["Desktop computer",200,.9,1],["CCTV and DVR",50,.9,1],["Phone charger",10,.7,1],["Custom light load",100,.9,1]],
M:[["Ceiling fan",75,.8,2],["BLDC fan",35,.9,1.5],["Air cooler",200,.75,2.5],["Mixer grinder",500,.75,3],["Washing machine",500,.7,3],["Refrigerator",200,.7,5],["Deep freezer",250,.7,6],["Water pump 0.5 HP",550,.75,4],["Water pump 1 HP",1000,.75,4.5],["Water pump 1.5 HP",1400,.75,5],["Borewell submersible 1 HP",1000,.7,6],["Borewell submersible 2 HP",1900,.7,6],["AC 1.5 ton, inverter type",1200,.95,2],["AC 1.5 ton, fixed speed",1700,.85,6],["AC 2 ton, fixed speed",2200,.85,6],["Air compressor 1 HP",1200,.8,5],["Motor 3 HP three-phase",2800,.8,6],["Motor 5 HP three-phase",4500,.85,6],["Lift or crane 7.5 HP",6500,.85,6],["Custom motor load",750,.75,4]],
P:[["Geyser",2000,1,1],["Electric iron",1000,1,1],["Electric kettle",1500,1,1],["Microwave oven",1200,.95,1],["Induction cooktop",1800,.95,1],["Room heater",1500,1,1],["Hair dryer",1200,1,1],["Electric oven",2000,1,1],["EV charger",3300,.95,1],["Custom power load",1000,1,1]]};
var CATN={L:"Light loads",M:"Motor loads",P:"Power loads"},CATD={L:"Lights and electronics",M:"Induction motors, with starting surge",P:"Heating and heavy appliances"};
var COLL={L:["Light load, total",500,1,6,.9,1,"L"],M:["Motor load, total",1500,1,6,.75,3,"M"],P:["Power load, total",2000,1,2,1,1,"P"]};
var loads=[["LED bulb",10,4,5,.9,1,"L"],["Wi-Fi router",15,1,24,.9,1,"L"],["TV",100,1,4,.9,1,"L"],["Ceiling fan",75,4,8,.8,2,"M"],["Refrigerator",200,1,10,.7,5,"M"],["Water pump 0.5 HP",550,1,1,.75,4,"M"]];
var $=function(i){return document.getElementById(i)};
var F=[["Watts",1],["Qty",2],["Hours",3],["PF",4],["Start ×",5]];
function rowHtml(l,i){
 return '<div class="ld"><div class="top"><input aria-label="Load name" value="'+String(l[0]).replace(/"/g,"&quot;")+'" data-i="'+i+'" data-k="0"><button class="x" aria-label="Remove" data-del="'+i+'">✕</button></div><div class="f">'
 +F.map(function(x){return '<div><label>'+x[0]+'</label><input type="number" min="0" step="any" value="'+l[x[1]]+'" data-i="'+i+'" data-k="'+x[1]+'"></div>'}).join("")+'</div></div>';
}
function rows(){
 $("rows").innerHTML=["L","M","P"].map(function(c){
  return '<div class="cat"><div class="ch"><h3>'+CATN[c]+'</h3><span id="sub-'+c+'"></span></div><div class="note" style="margin:0 0 8px">'+CATD[c]+'</div>'
  +loads.map(function(l,i){return l[6]==c?rowHtml(l,i):""}).join("")
  +'<div class="ca"><select data-addcat="'+c+'" aria-label="Add single load"><option value="">+ Add single load…</option>'+LIB[c].map(function(p,pi){return '<option value="'+pi+'">'+p[0]+' ('+p[1]+' W)</option>'}).join("")+'</select></div></div>';
 }).join("")+'';
}
function n(id){return parseFloat($(id).value)||0}
function f(x,d){return x.toLocaleString("en-IN",{maximumFractionDigits:d==null?1:d})}
function tr(a){return a.map(function(r){return "<tr><td>"+r[0]+"</td><td>"+r[1]+"</td></tr>"}).join("")}
var STD=[1,1.5,2,3,3.5,5,6,8,10,12,15,20,30,50,75,100];
var lmode="det",TD={L:[500,6,.9],M:[2500,6,.75],P:[2000,2,1]};
function totalsUI(){
 function fld(id,lb,v){return '<div><label for="'+id+'">'+lb+'</label><input id="'+id+'" type="number" min="0" step="any" value="'+v+'"></div>'}
 $("totals").innerHTML=["L","M","P"].map(function(c){var d=TD[c];
  return '<div class="cat"><div class="ch"><h3>'+CATN[c]+'</h3><span id="tsub-'+c+'"></span></div><div class="note" style="margin:0 0 8px">'+CATD[c]+'</div><div class="f3">'+fld("tW_"+c,"Total watts",d[0])+fld("tH_"+c,"Hours per day",d[1])+fld("tP_"+c,"Power factor",d[2])+'</div>'
  +(c=="M"?'<div class="f3">'+fld("tL_M","Largest motor (W)",1000)+fld("tS_M","Start ×",5)+'</div>':'')+'</div>'}).join("")
  +'<div class="note">Enter the total connected watts of each group and the hours they run per day. For motors, give the largest motor and its Start ×. The rest are counted as running only.</div>';
}
function getLoads(){
 if(lmode!="tot")return loads;
 var r=[];
 ["L","M","P"].forEach(function(c){var w=n("tW_"+c),h=n("tH_"+c),pf=n("tP_"+c)||1;if(w<=0)return;
  if(c=="M"){var big=Math.min(n("tL_M"),w),s=Math.max(n("tS_M"),1);
   if(big>0)r.push(["Largest motor",big,1,h,pf,s,c]);
   if(w-big>0)r.push(["Other motors",w-big,1,h,pf,1,c]);
  }else r.push([CATN[c],w,1,h,pf,1,c]);});
 return r;
}
function calc(){
 var L=getLoads();
 var hp=n("hp"),he=n("he")/100,hf=n("hf");
 if(!(he&&hf))$("hpout").textContent="";
 if(he&&hf){var w=hp*746/he;$("hpout").textContent=f(w,0)+" W input, "+f(w/hf/1000,2)+" kVA running. Use as the Watts value."}
 var runW=0,runVA=0,wh=0,extraMax=0,extraAll=0;
 L.forEach(function(l){var w=+l[1]||0,q=+l[2]||0,h=+l[3]||0,pf=+l[4]||1,s=Math.max(+l[5]||1,1);
  if(pf>1)pf=1;var va=w/pf,ex=va*(s-1);
  runW+=w*q;runVA+=va*q;wh+=w*q*h;extraAll+=ex*q;if(q>0&&ex>extraMax)extraMax=ex});
 var sub={L:[0,0],M:[0,0],P:[0,0]};
 L.forEach(function(l){var c=sub[l[6]];if(!c)return;var x=(+l[1]||0)*(+l[2]||0);c[0]+=x;c[1]+=x*(+l[3]||0)});
 ["L","M","P"].forEach(function(c){var t=f(sub[c][0]/1000,2)+" kW · "+f(sub[c][1]/1000,2)+" kWh/day";["sub-","tsub-"].forEach(function(k){var e=$(k+c);if(e)e.textContent=t})});
 var days=n("days"),V=n("volt"),dod=n("dod")/100,ie=n("inv")/100,be=n("bat")/100,mar=n("mar")/100,unit=n("unit"),psh=n("psh"),cc=n("cc"),pc=n("pc"),sc=n("sc"),dp=n("dayp")/100,pw=n("pw"),pr=n("pr")/100,rd=n("rd"),chc=n("chc");
 if(!(dod&&ie&&be&&unit&&V&&psh&&cc&&pc&&sc&&pw&&pr&&rd&&chc)){clearOut();return}
 var peakVA=runVA+($("mode").value=="all"?extraAll:extraMax);
 var dcWh=wh*days/ie,nomWh=dcWh/(dod*be)*(1+mar);
 var runA=runW/(V*ie),peakA=peakVA/(V*ie);
 var uE=Math.ceil(nomWh/V/unit),uC=Math.ceil(runA/(unit*cc)),uP=Math.ceil(peakA/(unit*pc));
 var units=Math.max(1,uE,uC,uP),drv=units==uE?"energy":units==uC?"continuous current":"starting surge";
 var ah=units*unit,bankKwh=ah*V/1000,usable=bankKwh*1000*dod*be/(1+mar),runH=runW?usable*ie/runW:0;
 var need=Math.max(runVA*1.25,peakVA/sc)/1000,std=STD.filter(function(x){return x>=need})[0]||Math.ceil(need);

 var dayWh=wh*dp,rechE=dcWh/be,rechDay=rechE/rd,solDay=dayWh/ie+rechDay;
 var kwp=solDay/(psh*pr)/1000,panels=Math.max(1,Math.ceil(kwp*1000/pw)),arr=panels*pw/1000;
 var genDay=arr*1000*pr*psh,surplus=Math.min(genDay-dayWh/ie,ah*chc*V*psh),rdays=surplus>0?rechE/surplus:Infinity;
 var chI=arr*1000*pr/V,chMax=ah*chc;
 $("kwh").textContent=f(bankKwh,1)+" kWh";
 $("units").textContent=units+" × "+unit+" Ah at "+V+" V in parallel ("+f(nomWh/1000,1)+" kWh needed for energy)";
 $("bank").innerHTML=Array(units+1).join("<i></i>");
 $("t0").innerHTML=tr([["Daily backup energy",f(wh/1000,2)+" kWh"],["Running load",f(runW/1000,2)+" kW / "+f(runVA/1000,2)+" kVA"],["Overall power factor",f(runVA?runW/runVA:1,2)],["Peak at motor start",f(peakVA/1000,2)+" kVA"]]);
 $("t1").innerHTML=tr([["Energy needed",f(nomWh/1000,1)+" kWh"],["Bank capacity",f(ah,0)+" Ah"],["Runtime at full load",f(runH,1)+" h"],["Battery current, running",f(runA,0)+" A ("+f(runA/ah,2)+" C)"],["Battery current, start",f(peakA,0)+" A ("+f(peakA/ah,2)+" C)"]]);
 $("sBat").textContent=f(bankKwh,1)+" kWh";$("sBatSub").textContent=units+" × "+unit+" Ah at "+V+" V";
 $("sInv").textContent=std+" kVA";$("sInvSub").textContent="minimum "+f(need,1)+" kVA";
 $("sPV").textContent=f(arr,2)+" kWp";$("sPVSub").textContent=panels+" × "+pw+" Wp";
 $("t2").innerHTML=tr([["Running load",f(runVA/1000,2)+" kVA"],["Running load plus 25%",f(runVA*1.25/1000,2)+" kVA"],["Peak start, after surge capacity",f(peakVA/sc/1000,2)+" kVA"],["Inverter needed",f(need,1)+" kVA"],["Standard size to pick",std+" kVA or higher"]]);
 $("t3").innerHTML=tr([["Daytime load energy",f(dayWh/1000,2)+" kWh/day"],["Battery recharge energy",f(rechE/1000,2)+" kWh"],["Solar array needed",f(arr,2)+" kWp ("+panels+" × "+pw+" Wp)"],["Daily generation",f(genDay/1000,1)+" kWh"],["Roof area (approx.)",f(arr*5,0)+" m²"],["MPPT current at battery voltage",f(arr*1000/V*1.25,0)+" A"],["Hybrid inverter PV input",f(arr/1.2,1)+" kW or more"],["Full recharge time",isFinite(rdays)?f(rdays,1)+" days":"not possible"]]);
 var sf="";
 if(chI>chMax)sf+='<div class="flag w">Solar charge current ('+f(chI,0)+' A) is above the battery limit ('+f(chMax,0)+' A). Add battery units or the surplus is wasted.</div>';
 if(!isFinite(rdays)||rdays>rd*1.05)sf+='<div class="flag w">Full recharge takes longer than the '+rd+' day target. Add panels or batteries, or allow grid or genset assist.</div>';
 else if(!sf)sf='<div class="flag">Array can refill the battery within the target.</div>';
 $("sflags").innerHTML=sf;
 $("flags").innerHTML=runW?'<div class="flag'+(drv=="energy"?'':' w')+'">Bank size is set by '+drv+'.'+(drv=="energy"?'':' Extra units are added to carry the current safely, so use a soft starter, VFD or staggered starting to reduce it.')+'</div>':'<div class="flag w">Add at least one load.</div>';
}
document.addEventListener("input",function(e){var t=e.target;if(t.dataset&&t.dataset.i!==undefined)loads[t.dataset.i][t.dataset.k]=t.dataset.k==="0"?t.value:parseFloat(t.value)||0;calc()});
document.addEventListener("change",function(e){if(e.target.id=="mode"||e.target.id=="volt")calc()});
document.addEventListener("change",function(e){var d=e.target.dataset;if(d&&d.addcat){var p=LIB[d.addcat][e.target.value];if(p){loads.push([p[0],p[1],1,4,p[2],p[3],d.addcat]);rows();calc()}}});
document.addEventListener("click",function(e){var d=e.target.dataset;if(d&&d.reset){$("cf").hidden=false;return}
 if(e.target.id=="cfn"){$("cf").hidden=true;return}
 if(e.target.id=="cfy"){$("cf").hidden=true;doReset();return}if(d&&d.lm){lmode=d.lm;$("rows").hidden=lmode=="tot";$("totals").hidden=lmode!="tot";document.querySelectorAll("[data-lm]").forEach(function(b){b.classList.toggle("on",b.dataset.lm==lmode)});calc();return}if(d&&d.coll){loads.push(COLL[d.coll].slice());rows();calc();return}if(d&&d.del!==undefined){loads.splice(+d.del,1);rows();calc()}});
var RS={bat:["days","volt","unit","dod","bat","mar","cc","pc"],inv:["inv","sc","mode"],sol:["psh","pw","dayp","pr","rd","chc"]},DEF={},DEFL=JSON.stringify(loads);
Object.keys(RS).forEach(function(k){RS[k].forEach(function(id){DEF[id]=$(id).value})});
Object.keys(RS).forEach(function(k){RS[k].forEach(function(id){if($(id).tagName=="INPUT")$(id).placeholder=DEF[id]})});
[["hp",1],["he",75],["hf",0.75]].forEach(function(a){$(a[0]).placeholder=a[1]});
function doReset(){
 loads=[];
 ["hp","he","hf"].forEach(function(id){$(id).value=""});
 Object.keys(RS).forEach(function(k){RS[k].forEach(function(id){var e=$(id);e.value=e.tagName=="INPUT"?"":DEF[id]})});
 lmode="det";$("rows").hidden=false;$("totals").hidden=true;
 document.querySelectorAll("[data-lm]").forEach(function(x){x.classList.toggle("on",x.dataset.lm=="det")});
 totalsUI();document.querySelectorAll("#totals input").forEach(function(x){x.value=""});
 rows();calc();
}
function clearOut(){
 ["sBat","sInv","sPV","kwh"].forEach(function(i){$(i).textContent="–"});
 ["sBatSub","sInvSub","sPVSub","units"].forEach(function(i){$(i).textContent=""});
 ["t0","t1","t2","t3","bank","sflags"].forEach(function(i){$(i).innerHTML=""});
 $("flags").innerHTML='<div class="flag w">Fill in the battery, inverter and solar fields to see results. The grey values show typical settings.</div>';
}
totalsUI();rows();calc();
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
}
