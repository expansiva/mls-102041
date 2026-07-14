declare global {
  interface Window {
		collabMessages: ICollabMessages;
		traceLivecicle:boolean;
		project_config: mls.l5_common.ProjectConfig;
	}
}

interface ICollabMessages {
  add: (message: string, typeMsg: ICollabMessageType, options?: IColllabMessageOptions) => void
  close : Function
}

export interface ICollabMessage {
	text: string,
	type: ICollabMessageType,
}

export interface IColllabMessageOptions {
	autoClose?: boolean,
	timeToClose?: number,
	clearOnClose?: boolean
}

export type ICollabMessageType = 'information' | 'alert' | 'error'
