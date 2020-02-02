import { IRecyclable } from "./ClassUtils";
import { RecycleObjType, foreach } from "./Attibute";

export class RecycleObject implements IRecyclable {

    recyleObj: RecycleObjType;

    onRecycle(): void {

		let { recyleObj } = this;
		if (recyleObj != undefined) {
			foreach(recyleObj, (v, k, o) => {
				this[k] = v;
				return true;
			});
		}
	}

}