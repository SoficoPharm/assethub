import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDevice } from './edit-device';

describe('EditDevice', () => {
  let component: EditDevice;
  let fixture: ComponentFixture<EditDevice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDevice],
    }).compileComponents();

    fixture = TestBed.createComponent(EditDevice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
