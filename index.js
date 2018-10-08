const fs = require('fs');
const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

class User {
    constructor() {
        this.fullname = '';
        this.eid = '';
        this.classes = [];
        this.addresses = [];
        this.invisible;
        this.see_all;
    }
    setClass(classes='') {
        if(classes !== ''){
            classes.split(/[,/@]+/).forEach((value) => {
                this.classes.push(value.replace(/"/g,''));
            });
        }
    }
    formatPhoneNumber(value='') {
        let newPhone;
        value = value.replace(/[( )]/g,'');
        if(!isNaN(value)){
            newPhone = phoneUtil.parseAndKeepRawInput(value,'BR');
            if(phoneUtil.isPossibleNumber(newPhone) && phoneUtil.isValidNumber(newPhone))
                return phoneUtil.format(newPhone,PNF.E164).split('+')[1]; 
        }
        return null;
    }
    isValidEmail(value='') {
        return (isNaN(value) && value.search('@.') > 0 && value.split(' ').length <= 1) ? true : false;
    }
    searchOnAddresses(value) {
        let obj = { type:'', tags:[], addres:'' };
        this.addresses.forEach(data => {
            if(data.addres === value)
                obj = data;
        });
        return obj;
    }
    setAddres(value='',title='') {
        let obj = this.searchOnAddresses(value);
        let type;
        if(value !== ''){
            title = title.split(' ');
            type = title[0].replace(/["@]/g,'');
            value = (type === 'phone' ? this.formatPhoneNumber(value) : (this.isValidEmail(value) ? value:null));
            if(value !== null){
                obj.type = type;
                obj.addres = value;    
                for(let i = 1,tags = title.length; i < tags; i++ )
                    obj.tags.push(title[i].replace(/["@/]/g,''));
                
                if(this.searchOnAddresses(value).addres === '')
                    this.addresses.push(obj);
            }
        }
    }
}
function formatFlag(flag,property) {
    if(property !== undefined && (flag === undefined || flag === ''))
        return property;
    return ((flag === '' || flag == 0 || flag === 'no') ? false:true);
}
//replace ',' that are in quotes,like "email Mae,Pai", to '@' 
function formatString(string) {
    let newString='';
    let inQuotes = false;
    for(let i=0,length=string.length;i<length;i++){
        if(!inQuotes || string[i] !== ',')
            newString = newString.concat(string[i]);
        else
            newString = newString.concat('@');
        if(string[i] == '"')
            inQuotes = !inQuotes;
    }
    return newString;
}
function searchUser(fileData,line,objects=[]) {
    let userIndex = -1;
    fileData[0].forEach((value,index) => {
        if(value === 'eid'){
            objects.forEach( (value,k) => {
                if(fileData[line][index] === value.eid)
                    userIndex = k;
            });
        }   
    });
    return (userIndex > -1 ? objects[userIndex]: new User());
}
fs.readFile('input.csv','utf-8',(error,data) => {
    let fileData = [];
    let objects = [];
    let user={};
    for(let i=0, length=data.split('\n').length; i < length;i++){
        fileData.push(formatString(data.split('\n')[i]).split(','));
    }
    for(let i=1,length=fileData.length;i < length;i++) {
        user = searchUser(fileData,i,objects);        
        fileData[i].forEach((value,index) => {
            switch(fileData[0][index]){
                case 'fullname': user.fullname = value; break;
                case 'eid': user.eid = value; break;
                case 'class': user.setClass(value); break;
                case 'invisible': user.invisible = formatFlag(value,user.invisible); break;
                case 'see_all': user.see_all = formatFlag(value,user.see_all); break;
                default: value.split(/[/]/).forEach( data => {
                    user.setAddres(data,fileData[0][index]); }); break; 
            }
        });
        if(searchUser(fileData,i,objects).eid === '')
            objects.push(user);
    }
    fs.writeFile('output.json',JSON.stringify(objects),(error) => {
        if(error !== null)
            console.log(error)
    });
});