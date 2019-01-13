if(window.NodeList && !NodeList.prototype.forEach){
    NodeList.prototype.forEach = function (callback, thisArg){
        thisArg = thisArg || window;
        for(var i = 0; i < this.length; i++){
            callback.call(thisArg, this[i], i, this);
        }
    }

}

class formValidator {

    constructor(selector){
        // bind all methods
        this.binds()

        // recupère le formulaire grace à l'ID passé en paramètre et les champs

        this.form = document.querySelector(selector['form'])

        if(!this.form) return

        // disabled native browser validation
        this.form.setAttribute('novalidate','novalidate')


        this.inputs = this.form.querySelectorAll('input:not([type=hidden]), textarea')


        if(!this.inputs) return



        //default config
        this.config =  { animationClass: 'default-class',form: '.default-form',ajax: false}

        // init
        this.init()

        /**
         * Permet de recuperer les valeurs de l'objet passé en
         * paramètre et les mettre dans la variables this.config
         */
        this.setOptions(selector);



    }


    binds() {
        //console.log("this.binds");

        // Superbe technique pour binder this aux différentes méthodes

        const events = ['init', 'addEvents', 'keyUpHandler', 'blurHandler', 'submitHandler', 'validateInput', 'validateForm', 'isValidLength', 'isValidEmail', 'isValidPhone', 'isValidSame']

        events.forEach((fn) => this[fn] = this[fn].bind(this))

    }

    init(){
        //console.log("init");

        // Lancer les écouteurs d(évènement
        this.addEvents()

    }

    setOptions(opts) {
        //console.log("setOptions");

        /**
         * Boucler sur les différents clés de l'objet passé en paramètre et stocker les valeurs dans this.config
         * La boucle for in permet d'itérer sur les différents propriétés d'un objet
         */
        let options = opts || {};
        if (typeof options === 'object' && Object.keys(options).length > 0){
            for (let property in options){
                if (typeof this.config[property] !== undefined){
                    this.config[property] = options[property];
                }
            }
        }
    }

    addEvents() {

        //console.log("addEvents");
        // Accrocher les listeners sur les différents champs

        this.form.addEventListener('submit', this.submitHandler)

        //la boucle for of permet d'itérer sur un nodelist
        this.inputs.forEach((input) => {
            input.addEventListener('blur', this.blurHandler)
            input.addEventListener('keyup', this.keyUpHandler)
        })
        //for (let input of this.inputs) {
        //	input.addEventListener('blur', this.blurHandler)
        //	input.addEventListener('keyup', this.keyUpHandler)
        //}
    }

    keyUpHandler(ev) {
        // console.log('keyUpHandler')

        // La fonction appellé lors de keyup
        const input = ev.target

        const errors = this.validateInput(input)
        if (errors === 0) {
            this.validateForm()
        }
    }


    blurHandler(ev) {
        // console.log('blurHandler')

        const input = ev.target

        const errors = this.validateInput(input)
        //console.log(errors);

        if (errors === 0) {
            this.validateForm()
        }
    }

    submitHandler(ev) {

        // La fonction appellé lors de la soumission du formulaire

        ev.preventDefault()


        // on vérifie si les champs sont bien renseignés
        //for (let input of this.inputs) { this.validateInput(input) }
        this.inputs.forEach((input) => this.validateInput(input))


        const valid = this.validateForm()

        if(valid){
            // Si pas d'erreur on soumet le formuaire
            // if the form will be sent im ajax
            if (this.config.ajax){
                // remove the green background
                this.inputs.forEach((input) => input.style.backgroundColor = '')
                // send the mail in ajax
                this.config.ajaxMethod.send()
            }else {
                ev.currentTarget.submit();
            }
        }else{

            // On ajoute la class passée en paramètre pour l'animation
            this.inputs.forEach((input) => {
                //const error = this.validateInput(input)

                //console.log(error);
                if(this.validateInput(input) > 0) {
                    input.classList.add(this.config.animationClass)

                    // on retire la class à la fin de l'animation
                    input.addEventListener('animationend', (ev) =>{
                        ev.currentTarget.classList.remove(this.config.animationClass)
                    })
                }
            })

            //for (let input of this.inputs) {


            //}
        }
    }

    validateInput(input) {
        //console.log(input)

        // Vérification des valeurs des champs

        // on recupère les attributs data du champ
        const min = input.dataset.min || input.getAttribute('minLength')
        const max = input.dataset.max || input.getAttribute('maxLength')
        const req = input.dataset.req
        const type = input.dataset.type
        const same = input.dataset.same

        let errors = []



        // check length
        if (min && max) {
            if (!this.isValidLength(input, min, max)) {
                errors.push(`Ce champ doit faire entre ${min} et ${max} caractères`)
            }
        } else if (min) {
            if (!this.isValidLength(input, min, null)) {
                errors.push(`Ce champ doit faire plus ${min} caractères`)
            }
        } else if (max) {
            if (!this.isValidLength(input, null, max) || input.value == "") {
                errors.push(`Ce champ doit faire moins de ${max} caractères`)
            }
        }


        // check type
        if (type) {
            switch (type) {
                case 'email':
                    if (!this.isValidEmail(input)) {
                        errors.push('Email non valide')
                    }
                    break
                case 'phone':
                    if (!this.isValidPhone(input)) {
                        errors.push('Numéro de téléphone non valide')
                    }
                    break
            }
        }

        // check same passwords
        if (same) {
            const target = this.form.querySelector(`input[name="${same}"]`)
            if (!this.isValidSame(input, target) || input.value.length == "") {
                errors.push('Les mots de passe ne correspondent pas ')
            }
        }

        // check not empty if no data
        if (!min && !max && !type && !same || req) {
            if (input.value === '') {
                errors.push('Ce champ ne peux pas être vide')
            }
        }

        // display errors
        input.errors = errors.length

        const error_message = errors.join('<br>')

        if (errors.length > 0) {
            this.set_error(input,error_message)
        } else {
            this.set_success(input,"")
        }

        return errors.length
    }
    set_error(elem,error_message) {

        // on crée la span qui servira à afficher les erreurs
        let span = document.createElement("span")
        //span.style.color = "red"
        span.style.fontSize = "13px"

        span.innerHTML = error_message

        elem.style.backgroundColor = "#d3f6df"
        // elem.style.backgroundColor = "red"
        elem.style.backgroundColor = "#e28989"

        //on ajoute l'élement au dom
        //permet d'insérer un éléement après
        if(!elem.nextElementSibling) {
            elem.insertAdjacentElement("afterend", span);
        } else {
            elem.nextElementSibling.innerHTML = error_message
        }
    }
    set_success(elem,success_message) {


        // on crée la span qui servira à afficher les erreur
        elem.style.backgroundColor = "#45a968"

        if(elem.nextElementSibling) {
            elem.nextElementSibling.innerHTML = success_message
        }// else {
        //  elem.nextElementSibling.innerHTML = success_message
        //}

    }

    isValidLength(input, min, max) {
        // console.log('isValidLength')

        const length = input.value.trim().length
        if (!min && length <= max) {
            return true
        } else if (!max && length >= min) {
            return true
        } else if (length >= min && length <= max) {
            return true
        }
        return false
    }

    validateForm() {
        // console.log('validateForm')

        let errors = 0

        this.inputs.forEach((input) => {
            errors += input.errors
        })

        return errors === 0
    }

    isValidEmail(input) {
        // console.log('isValidEmail')

        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i
        return re.test(input.value)
    }

    isValidPhone(input) {
        // console.log('isValidPhone')

        const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{2,6}$/i
        return re.test(input.value)
    }

    isValidSame(input, target) {
        // console.log('isValidSame')

        // verifie si les deux mots de passe sont valides

        if (input.value === target.value) {
            return true
        }
        return false
    }

}

// usage
/*const validator = new formValidator({
	animationClass: 'shake',
	form: 'myForm'
})*/

