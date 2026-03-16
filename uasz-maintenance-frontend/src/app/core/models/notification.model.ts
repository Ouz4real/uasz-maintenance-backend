export interface NotificationDto {
  id: number;
  titre: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  lu: boolean;
  dateCreation: string;
  dateLecture?: string;
  entityType?: string;
  entityId?: number;
}
