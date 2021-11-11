const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let width = 800,height = 800;
let text = "";
window.addEventListener("load",()=>{
    width = (window.innerWidth)
    height = window.innerHeight;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.width = canvas.width;
    ctx.height = canvas.height;
});
document.getElementById("apply-btn").addEventListener("click",()=>{
    console.log("click");
    renderGCode();
})
let uploader = document.getElementById('file');
uploader.onchange = (e)=>{
    // motion.open(e.target.files[0].path);
    readTextFile(e.target.files[0]);
    uploader.value = "";
    
}
canvas.onclick = ()=>{
    uploader.click();
};
async function renderGCode()
{
    let backgroundColor = document.getElementById("bg-color").value;
    let g0Color = document.getElementById("g0-color").value;
    let g1Color = document.getElementById("g1-color").value;
    let g1r = Number(`0x${g1Color.substr(1,2)}`);
    let g1g = Number(`0x${g1Color.substr(3,2)}`);
    let g1b = Number(`0x${g1Color.substr(5,2)}`);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0,0,width,height); 
    ctx.fillStyle = "#000";
    ctx.font = "20px Arial"
    ctx.fillText("loading...",width/2-40,height/2);
    ctx.fillStyle = backgroundColor;
    await delay(100);
    ctx.fillRect(0,0,width,height); 
    let lines = text.split('\n');
    let lastX = 0,lastY = 0,lastS = 0;
    let actions = [];
    let offsetX = document.getElementById("x-offset").value*1.0,offsetY = document.getElementById("y-offset").value*1.0;
    let xScale = document.getElementById("scale").value*1.0, yScale = document.getElementById("scale").value*1.0;
    lines.forEach((line)=>
    {
        line = line.toLowerCase();
        let type = line.substr(0,1);
        let cmd = parseInt(line.substr(1,line.indexOf(" ")));
        if(type=='g')
        {
            switch(cmd)
            {
                case 0:
                case 1:
                {
                    let xIndex = line.indexOf('x');
                    let yIndex = line.indexOf('y');
                    let sIndex = line.indexOf('s');
                    let x = lastX, y = lastY,s = lastS;
                    let action = new Action(type,cmd);
                    if(xIndex>-1)
                    {
                        let spaceIndex = line.indexOf(' ',xIndex);
                        x = xScale*Math.abs(parseFloat(line.substr(xIndex+1,spaceIndex==-1?line.length:spaceIndex)))-offsetX;
                        lastX = x;
                    }
                    if(yIndex>-1)
                    {
                        let spaceIndex = line.indexOf(' ',yIndex);
                        y = yScale*Math.abs(parseFloat(line.substr(yIndex+1,spaceIndex==-1?line.length:spaceIndex)))-offsetY;
                        lastY = y;
                    }
                    if(sIndex>-1)
                    {
                        let spaceIndex = line.indexOf(' ',sIndex);
                        s = parseFloat(line.substr(sIndex+1,spaceIndex==-1?line.length:spaceIndex));
                        lastS = s;
                    }
                    action.x = x;
                    action.y = y;
                    action.s = s;
                    if(offsetX==-1&&offsetY==-1&&x>0&&y>0)
                    {
                        action.x = 0;
                        action.y = 0;
                        lastX = 0;
                        lastY = 0;
                        offsetX = x;
                        offsetY = y;
                    }
                    actions.push(action);
                }
                break;
            }
        }
    });
    lastX = 0,lastY = 0;
    ctx.moveTo(0,0);
    let outputs = actions;
    let end = new Action('g',0);
    end.x = 0;
    end.y = 0;
    lastX = 0,lastY = 0;    
    console.log("start")
    for(let i=0;i<outputs.length;i++)
    {
        let action = outputs[i];
        if(action.cmd==0||action.s==0)
        {
            ctx.strokeStyle = g0Color;
            ctx.beginPath();
            ctx.moveTo(lastX,lastY);
            ctx.lineTo(action.x,action.y);
            ctx.stroke();
        }
        else if(action.cmd==1.2)
        {
            ctx.strokeStyle = "#00a"
            ctx.beginPath();
            ctx.moveTo(lastX,lastY);
            ctx.lineTo(action.x,action.y);
            ctx.stroke();
        }
        else if(action.cmd==1.3)
        {
            ctx.strokeStyle = "#0a0"
            ctx.beginPath();
            ctx.moveTo(lastX,lastY);
            ctx.lineTo(action.x,action.y);
            ctx.stroke();
        }
        else if(action.cmd==1.4)
        {
            ctx.strokeStyle = "#c00"
            ctx.beginPath();
            ctx.moveTo(lastX,lastY);
            ctx.lineTo(action.x,action.y);
            ctx.stroke();
        }
        else
        {
            ctx.strokeStyle = action.s==0?`${g0Color}`:`rgba(${g1r},${g1g},${g1b},${action.s/1000})`
            ctx.beginPath();
            ctx.moveTo(lastX,lastY);
            ctx.lineTo(action.x,action.y);
            ctx.stroke();
        }
        lastX = action.x,lastY = action.y;
        // await delay(1);
    }  
}
function readTextFile(file)
{
    let reader = new FileReader();
    reader.addEventListener('load', async (e)=>{
        text = e.target.result;
        renderGCode();
        // ctx.strokeStyle = "#800"
        // ctx.beginPath();
        // ctx.moveTo(lastX,lastY);
        // ctx.lineTo(0,0);
        // ctx.stroke(); 
    });
    reader.readAsText(file);
}
async function delay(time)
{
    return new Promise(resolve=>{
        setTimeout(resolve,time);
    })
}
class Action
{
    constructor(type,cmd)
    {
        this.type = type;
        this.cmd = cmd;
        this._x = 0;
        this._y = 0;
        this._s = 0;
    }
    set x(v)
    {
        this._x = v;
    }
    get x()
    {
        return this._x;
    }
    set y(v)
    {
        this._y = v;
    }
    get y()
    {
        return this._y;
    }
    set s(v)
    {
        this._s = v;
    }
    get s()
    {
        return this._s;
    }
}