class apiError extends error {
    constructor(
        statuscode,
        message="somethimg is wrong",
        errors=[],
        stack=""
    ){
        super(message)
        this.statuscode=statuscode,
        this.data=null,
        this.message=message,
        this.errors=errors,
        this.success=false
        if(stack){
            this.stack
        }
        else{
            errors.captureStackTrace(this,this.constructor)
        } 
    }
}
export {apiError}