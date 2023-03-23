// based on https://github.com/luser-dr00g/luser-dr00g.github.io/blob/684cb94101a9dd16ddb54d88583369718dc3d7aa/weather5/mvc.js
// which was based on https://gist.github.com/mlhaufe/c841b2269b0099c3c52648717f9551cc

class Model {
  constructor(){
    this._observers = [];
  }
  observe( observer ){ this._observers.push( observer ); }
  unobserve(observer){ this._observers=this._observers.filter(o=> o!==observer); }
  notify( data ){ this._observers.forEach(o=> o.update(data) ); }
  set value( value ){
    this._value = value;
    this.onChange( value );
    this.notify( value );
  }
  get value(){
    return this._value;
  }
  onChange(){ }
}

class View {
  constructor( model ){
    if( model ){ this.setModel( model ); model.observe( this ); }
  }
  update( data ){
    this.onUpdate( data );
  }
  onUpdate(){ }
  getModel(){ return this._model; }
  setModel( model ){ this._model = model; }
  setHtmlElement( element ){ this._htmlElement = element; }
  find( sel ){
    return (this._htmlElement || document).querySelector( sel );
  }
  findAll( sel ){
    return Array.from( (this._htmlElement || document).querySelectorAll( sel ) );
  }
  show( element ){
    (element || this._htmlElement).hidden = false;
  }
  hide( element ){
    (element || this._htmlElement).hidden = true;
  }
}

//export { Model, View };
